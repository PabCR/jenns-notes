"""create_packets_and_join_table

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create packets table
    op.create_table(
        'packets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('share_link', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("char_length(name) >= 1", name="check_name_length"),
        sa.UniqueConstraint('share_link', name='uq_packets_share_link'),
    )
    
    # Create packet_resources join table
    op.create_table(
        'packet_resources',
        sa.Column('packet_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('packet_id', 'resource_id'),
    )
    
    # Create indexes
    op.create_index('idx_packets_user_id', 'packets', ['user_id'])
    op.create_index('idx_packets_share_link', 'packets', ['share_link'])
    op.create_index('idx_packet_resources_packet_id', 'packet_resources', ['packet_id'])
    op.create_index('idx_packet_resources_resource_id', 'packet_resources', ['resource_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_packet_resources_resource_id', table_name='packet_resources')
    op.drop_index('idx_packet_resources_packet_id', table_name='packet_resources')
    op.drop_index('idx_packets_share_link', table_name='packets')
    op.drop_index('idx_packets_user_id', table_name='packets')
    
    # Drop tables
    op.drop_table('packet_resources')
    op.drop_table('packets')
