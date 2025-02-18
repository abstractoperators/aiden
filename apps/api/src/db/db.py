from psycopg2.extensions import cursor as Tcursor


def get_unique_accounts(cursor: Tcursor):
    """
    Returns a list of unique accounts ~ agents.
    """
    cursor.execute("SELECT id, name from accounts")
    accounts = cursor.fetchall()
    return accounts


def create_runtime(cursor: Tcursor, url: str, agent_id: str = ""):
    """
    Create a new runtime entry.
    """
    cursor.execute(
        "INSERT INTO RUNTIMES (url, agent_id) VALUES (%s, %s)", (url, agent_id)
    )


def get_runtimes(cursor: Tcursor):
    """
    Returns a list of all runtimes
    """
    cursor.execute("SELECT * from RUNTIMES")
    runtimes = cursor.fetchall()
    return runtimes


def get_runtime_for_agent(cursor: Tcursor, agent_id: str) -> str:
    cursor.execute("SELECT * from RUNTIMES WHERE agent_id = %s", (agent_id,))
    runtime = cursor.fetchone()
    return runtime[0] if runtime else ""


def update_runtime(cursor: Tcursor, url: str, agent_id: str = ""):
    """
    Updates the agent_id for a runtime.
    """
    cursor.execute("UPDATE RUNTIMES SET agent_id = %s WHERE url = %s", (agent_id, url))
