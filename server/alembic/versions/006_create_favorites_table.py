"""create_favorites_table

Revision ID: 006
Revises: 005
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_resource_favorites table
    op.create_table(
        'user_resource_favorites',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('resource_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('user_id', 'resource_id'),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], ondelete='CASCADE'),
    )
    
    # Create indexes
    op.create_index('idx_favorites_user_id', 'user_resource_favorites', ['user_id'])
    op.create_index('idx_favorites_resource_id', 'user_resource_favorites', ['resource_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_favorites_resource_id', table_name='user_resource_favorites')
    op.drop_index('idx_favorites_user_id', table_name='user_resource_favorites')
    
    # Drop table
    op.drop_table('user_resource_favorites')

