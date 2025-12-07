"""create_resources_table

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create resources table
    op.create_table(
        'resources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.String(length=10), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('auto_tagged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('condition', sa.Text(), nullable=True),
        sa.Column('audience', sa.Text(), nullable=True),
        sa.Column('topic', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("char_length(title) >= 1", name="check_title_length"),
        sa.CheckConstraint("type IN ('pdf', 'link', 'note')", name="check_type_enum"),
    )
    
    # Create indexes
    op.create_index('idx_resources_user_id', 'resources', ['user_id'])
    op.create_index('idx_resources_type', 'resources', ['type'])
    op.create_index('idx_resources_created_at', 'resources', ['created_at'], postgresql_ops={'created_at': 'DESC'})


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_resources_created_at', table_name='resources')
    op.drop_index('idx_resources_type', table_name='resources')
    op.drop_index('idx_resources_user_id', table_name='resources')
    
    # Drop table
    op.drop_table('resources')

