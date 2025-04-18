"""Add last_healthcheck and failed_healthchecks to runtime

Revision ID: 4ae322b296e4
Revises: cc2c27d22728
Create Date: 2025-03-22 13:25:20.964627

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision: str = "4ae322b296e4"
down_revision: Union[str, None] = "cc2c27d22728"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "runtime", sa.Column("last_healthcheck", sa.DateTime(), nullable=True)
    )
    op.add_column(
        "runtime", sa.Column("failed_healthchecks", sa.Integer(), nullable=True)
    )
    # Set to 0, then make it non-nullable.
    conn = op.get_bind()
    stmt = text("UPDATE runtime SET failed_healthchecks = 0")
    conn.execute(stmt)
    op.alter_column(
        "runtime", "failed_healthchecks", existing_type=sa.Integer(), nullable=False
    )
    op.drop_column("runtime", "started")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "runtime",
        sa.Column("started", sa.BOOLEAN(), autoincrement=False, nullable=True),
    )
    op.drop_column("runtime", "failed_healthchecks")
    op.drop_column("runtime", "last_healthcheck")
    # ### end Alembic commands ###
