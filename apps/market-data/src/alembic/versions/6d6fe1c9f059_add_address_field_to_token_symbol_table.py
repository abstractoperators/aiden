"""add address field to token symbol table

Revision ID: 6d6fe1c9f059
Revises: c860b562f523
Create Date: 2025-07-15 14:48:21.697067

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision: str = '6d6fe1c9f059'
down_revision: Union[str, None] = 'c860b562f523'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'tokensymbol',
        sa.Column(
            'address',
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=True,
            server_default="0x0000000000000000000000000000000000000000",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tokensymbol', 'address')
