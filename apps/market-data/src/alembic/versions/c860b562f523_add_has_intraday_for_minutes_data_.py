"""add has_intraday for minutes data support

Revision ID: c860b562f523
Revises: b7e23ef12b4c
Create Date: 2025-07-07 20:22:43.742686

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision: str = 'c860b562f523'
down_revision: Union[str, None] = 'b7e23ef12b4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'tokensymbol',
        sa.Column(
            'has_intraday',
            sa.Boolean(),
            nullable=True,
        ),
    )

    # Set to True, then make it non-nullable
    conn = op.get_bind()
    stmt = sa.text("UPDATE tokensymbol SET has_intraday = false")
    conn.execute(stmt)

    op.alter_column(
        'tokensymbol',
        'has_intraday',
        existing_type=sa.Boolean(),
        nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tokensymbol', 'has_intraday')
