"""Pin search_path for prevent_resource_delete_if_in_packet trigger function."""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER FUNCTION public.prevent_resource_delete_if_in_packet() SET search_path = public;"
    )


def downgrade() -> None:
    op.execute(
        "ALTER FUNCTION public.prevent_resource_delete_if_in_packet() RESET search_path;"
    )
