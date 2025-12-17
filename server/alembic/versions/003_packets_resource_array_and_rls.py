"""Introduce packet resource_ids array, drop join table, and add RLS policies."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _create_policy(name: str, table: str, definition: str) -> None:
    """Helper to create a policy if it does not already exist."""
    op.execute(
        f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies
                WHERE policyname = '<name>' AND tablename = '<table>' AND schemaname = 'public'
            ) THEN
                {definition};
            END IF;

        END
        $$;
        """
    )


def upgrade() -> None:
    # 1) Add resource_ids array to packets and backfill from packet_resources (ordered by position)
    op.add_column(
        "packets",
        sa.Column(
            "resource_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=False,
            server_default="{}",
        ),
    )

    op.execute(
        """
        UPDATE packets p
        SET resource_ids = COALESCE(pr.resource_ids, '{}')
        FROM (
            SELECT packet_id, array_agg(resource_id ORDER BY position) AS resource_ids
            FROM packet_resources
            GROUP BY packet_id
        ) pr
        WHERE p.id = pr.packet_id;
        """
    )

    # Index for array containment searches
    op.create_index(
        "idx_packets_resource_ids_gin",
        "packets",
        ["resource_ids"],
        postgresql_using="gin",
    )

    # Drop join table now that data is migrated
    op.drop_index("idx_packet_resources_resource_id", table_name="packet_resources")
    op.drop_index("idx_packet_resources_packet_id", table_name="packet_resources")
    op.drop_table("packet_resources")

    # Remove default to match application behavior
    op.alter_column("packets", "resource_ids", server_default=None)

    # 2) Enable Row Level Security
    op.execute("ALTER TABLE resources ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE packets ENABLE ROW LEVEL SECURITY;")

    # 3) RLS policies - resources
    _create_policy(
        "auth_resources_select",
        "resources",
        """
        CREATE POLICY auth_resources_select
        ON resources FOR SELECT
        TO authenticated
        USING (true)
        """,
    )

    _create_policy(
        "auth_resources_insert",
        "resources",
        """
        CREATE POLICY auth_resources_insert
        ON resources FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid())
        """,
    )

    _create_policy(
        "auth_resources_update",
        "resources",
        """
        CREATE POLICY auth_resources_update
        ON resources FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
        """,
    )

    _create_policy(
        "auth_resources_delete",
        "resources",
        """
        CREATE POLICY auth_resources_delete
        ON resources FOR DELETE
        TO authenticated
        USING (
            user_id = auth.uid()
            AND NOT EXISTS (
                SELECT 1 FROM packets WHERE resources.id = ANY(packets.resource_ids)
            )
        )
        """,
    )

    _create_policy(
        "anon_resources_select_in_packets",
        "resources",
        """
        CREATE POLICY anon_resources_select_in_packets
        ON resources FOR SELECT
        TO anon
        USING (
            EXISTS (
                SELECT 1 FROM packets WHERE resources.id = ANY(packets.resource_ids)
            )
        )
        """,
    )

    # 4) RLS policies - packets
    _create_policy(
        "auth_packets_select",
        "packets",
        """
        CREATE POLICY auth_packets_select
        ON packets FOR SELECT
        TO authenticated
        USING (true)
        """,
    )

    _create_policy(
        "anon_packets_select_by_share_link",
        "packets",
        """
        CREATE POLICY anon_packets_select_by_share_link
        ON packets FOR SELECT
        TO anon
        USING (share_link IS NOT NULL)
        """,
    )

    _create_policy(
        "auth_packets_insert",
        "packets",
        """
        CREATE POLICY auth_packets_insert
        ON packets FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid())
        """,
    )

    _create_policy(
        "auth_packets_update",
        "packets",
        """
        CREATE POLICY auth_packets_update
        ON packets FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid())
        """,
    )

    _create_policy(
        "auth_packets_delete",
        "packets",
        """
        CREATE POLICY auth_packets_delete
        ON packets FOR DELETE
        TO authenticated
        USING (user_id = auth.uid())
        """,
    )

    # 5) Trigger to block deleting resources that are still referenced
    op.execute(
        """
        CREATE OR REPLACE FUNCTION prevent_resource_delete_if_in_packet()
        RETURNS trigger AS $$
        BEGIN
            IF EXISTS (SELECT 1 FROM packets WHERE OLD.id = ANY(resource_ids)) THEN
                RAISE EXCEPTION 'Resource is used in a packet and cannot be deleted';
            END IF;
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    op.execute("DROP TRIGGER IF EXISTS trg_prevent_resource_delete ON resources;")
    op.execute(
        """
        CREATE TRIGGER trg_prevent_resource_delete
        BEFORE DELETE ON resources
        FOR EACH ROW EXECUTE FUNCTION prevent_resource_delete_if_in_packet();
        """
    )


def downgrade() -> None:
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS trg_prevent_resource_delete ON resources;")
    op.execute("DROP FUNCTION IF EXISTS prevent_resource_delete_if_in_packet;")

    # Drop policies
    for name, table in [
        ("auth_resources_select", "resources"),
        ("auth_resources_insert", "resources"),
        ("auth_resources_update", "resources"),
        ("auth_resources_delete", "resources"),
        ("anon_resources_select_in_packets", "resources"),
        ("auth_packets_select", "packets"),
        ("anon_packets_select_by_share_link", "packets"),
        ("auth_packets_insert", "packets"),
        ("auth_packets_update", "packets"),
        ("auth_packets_delete", "packets"),
    ]:
        op.execute(
            f"""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_policies WHERE polname = '{name}' AND tablename = '{table}') THEN
                    EXECUTE 'DROP POLICY {name} ON {table}';
                END IF;
            END
            $$;
            """
        )

    # Disable RLS (was off before this migration)
    op.execute("ALTER TABLE resources DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE packets DISABLE ROW LEVEL SECURITY;")

    # Recreate join table
    op.create_table(
        "packet_resources",
        sa.Column("packet_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("resource_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("packet_id", "resource_id"),
    )
    op.create_index("idx_packet_resources_packet_id", "packet_resources", ["packet_id"])
    op.create_index(
        "idx_packet_resources_resource_id", "packet_resources", ["resource_id"]
    )

    # Rehydrate join table from resource_ids (preserve order)
    op.execute(
        """
        INSERT INTO packet_resources (packet_id, resource_id, position)
        SELECT p.id, resource_id, ord.idx - 1
        FROM packets p
        CROSS JOIN LATERAL UNNEST(p.resource_ids) WITH ORDINALITY AS ord(resource_id, idx);
        """
    )

    # Drop array column/index
    op.drop_index("idx_packets_resource_ids_gin", table_name="packets")
    op.drop_column("packets", "resource_ids")
