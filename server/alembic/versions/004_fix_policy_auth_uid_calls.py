"""Replace auth.uid() with SELECT auth.uid() in RLS policies for performance."""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # resources policies
    op.execute("DROP POLICY IF EXISTS auth_resources_insert ON resources;")
    op.execute(
        """
        CREATE POLICY auth_resources_insert
        ON resources FOR INSERT
        TO authenticated
        WITH CHECK (user_id = (select auth.uid()));
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_resources_update ON resources;")
    op.execute(
        """
        CREATE POLICY auth_resources_update
        ON resources FOR UPDATE
        TO authenticated
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_resources_delete ON resources;")
    op.execute(
        """
        CREATE POLICY auth_resources_delete
        ON resources FOR DELETE
        TO authenticated
        USING (
          user_id = (select auth.uid())
          AND NOT EXISTS (
            SELECT 1 FROM packets WHERE resources.id = ANY(packets.resource_ids)
          )
        );
        """
    )

    # packets policies
    op.execute("DROP POLICY IF EXISTS auth_packets_insert ON packets;")
    op.execute(
        """
        CREATE POLICY auth_packets_insert
        ON packets FOR INSERT
        TO authenticated
        WITH CHECK (user_id = (select auth.uid()));
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_packets_update ON packets;")
    op.execute(
        """
        CREATE POLICY auth_packets_update
        ON packets FOR UPDATE
        TO authenticated
        USING (user_id = (select auth.uid()))
        WITH CHECK (user_id = (select auth.uid()));
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_packets_delete ON packets;")
    op.execute(
        """
        CREATE POLICY auth_packets_delete
        ON packets FOR DELETE
        TO authenticated
        USING (user_id = (select auth.uid()));
        """
    )


def downgrade() -> None:
    # Recreate pre-fix policies using auth.uid() directly
    op.execute("DROP POLICY IF EXISTS auth_resources_insert ON resources;")
    op.execute(
        """
        CREATE POLICY auth_resources_insert
        ON resources FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_resources_update ON resources;")
    op.execute(
        """
        CREATE POLICY auth_resources_update
        ON resources FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_resources_delete ON resources;")
    op.execute(
        """
        CREATE POLICY auth_resources_delete
        ON resources FOR DELETE
        TO authenticated
        USING (
          user_id = auth.uid()
          AND NOT EXISTS (
            SELECT 1 FROM packets WHERE resources.id = ANY(packets.resource_ids)
          )
        );
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_packets_insert ON packets;")
    op.execute(
        """
        CREATE POLICY auth_packets_insert
        ON packets FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_packets_update ON packets;")
    op.execute(
        """
        CREATE POLICY auth_packets_update
        ON packets FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
        """
    )

    op.execute("DROP POLICY IF EXISTS auth_packets_delete ON packets;")
    op.execute(
        """
        CREATE POLICY auth_packets_delete
        ON packets FOR DELETE
        TO authenticated
        USING (user_id = auth.uid());
        """
    )
