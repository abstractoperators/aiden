import os

import boto3
from mypy_boto3_ecs.client import ECSClient
from mypy_boto3_elbv2.client import ElasticLoadBalancingv2Client as ELBv2Client
from mypy_boto3_sts.client import STSClient


def get_env_vars():
    """
    Gets env vars like vpc id
    """
    env = os.getenv("ENV")
    if env == "dev":
        pass
        # TODO: Figure out what do to do with local runtimes that aren't on AWS
    elif env == "staging":
        num = "TODO"  # TODO
        vpc_id = "vpc-028f84ceaa7ceffdf"
        target_group_name = f"aiden-runtime-staging-{num}"
        http_listener_arn = "arn:aws:elasticloadbalancing:us-east-1:008971649127:listener/app/aiden-staging/cca8548986966f89/681e2c72542f3c11"  # noqa
        https_listener_arn = "arn:aws:elasticloadbalancing:us-east-1:008971649127:listener/app/aiden-staging/cca8548986966f89/0e71c1863b9f0654"  # noqa
        service_name = f"aiden-runtime-staging-{num}"
        host = "staigen.space"
        subdomain = f"aiden-runtime-staging-{num}"
        cluster = "AidenStaging"
        task_definition_arn = "arn:aws:ecs:us-east-1:008971649127:task-definition/aiden-agent-runtime-staging"
        subnets = ["subnet-0c145d71e9bc921ce", "subnet-08a79f79b7375c569"]
        security_groups = ["sg-0475538bebfc71f2e"]
    elif env == "prod":
        num = "TODO"  # TODO
        vpc_id = "vpc-002b5682c46769515"
        target_group_name = f"aiden-runtime-{num}"
        http_listener_arn = (
            "arn:aws:elasticloadbalancing:us-east-1:008971649127:listener/app/aiden/c75e38614c895163/0418e5a3323e20fc",
        )  # noqa
        https_listener_arn = "arn:aws:elasticloadbalancing:us-east-1:008971649127:listener/app/aiden/c75e38614c895163/5ccef0a9112d870c"  # noqa
        service_name = f"aiden-runtime-{num}"
        host = "aiden.space"
        subdomain = f"aiden-runtime-{num}"
        cluster = "Aiden"
        task_definition_arn = (
            "arn:aws:ecs:us-east-1:008971649127:task-definition/aiden-agent-runtime"
        )
        subnets = ["subnet-03609df324958be8e", "subnet-0643691ae2f5f1e32"]
        security_groups = ["sg-08dd9f6f9ecc9bfe9"]

    return {
        "vpc_id": vpc_id,
        "target_group_name": target_group_name,
        "http_listener_arn": http_listener_arn,
        "https_listener_arn": https_listener_arn,
        "service_name": service_name,
        "host": host,
        "subdomain": subdomain,
        "cluster": cluster,
        "task_definition_arn": task_definition_arn,
        "subnets": subnets,
        "security_groups": security_groups,
    }


def get_role_session() -> STSClient:
    """
    Gets the AidenAPI role session.
    """
    if os.getenv("ENV") == "dev":
        # If dev, assume the role using your user permissions
        sts_client = boto3.client("sts")
        role_arn = "arn:aws:iam::008971649127:role/AidenAPI"
        resp = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="AidenAPI")

        credentials = resp["Credentials"]
        assumed_role_session = boto3.Session(
            aws_access_key_id=credentials["AccessKeyId"],
            aws_secret_access_key=credentials["SecretAccessKey"],
            aws_session_token=credentials["SessionToken"],
        )
    else:
        # Otherwise, on staging and dev, the ECS task itself will manage permissions
        assumed_role_session = boto3.Session()

    return assumed_role_session


def create_https_group(
    elbv2_client: ELBv2Client,
    target_group_name: str,
    vpc_id: str,
) -> str:
    """
    Creates an HTTPS target group unassociated with a load balancer/service
    Returns its ARN
    """
    https_target_group = elbv2_client.create_target_group(
        Name=target_group_name,
        VpcId=vpc_id,
        Protocol="HTTPS",
        Port=443,
        TargetType="ip",
        HealthCheckProtocol="HTTPS",
        HealthCheckPort="traffic-port",
        HealthCheckPath="/ping",
    )
    arn = https_target_group["TargetGroups"][0]["TargetGroupArn"]
    return arn


def create_listener_rules(
    elbv2_client: ELBv2Client,
    http_listener_arn: str,
    https_listener_arn: str,
    host_header_pattern: str,
    target_group_arn: str,
    priority: int,
):
    """
    Creates an HTTP and HTTPS Rule.
    HTTP Rule redirects to HTTPS
    HTTPS Rule forwards to the specified target group.
    """
    conditions = [
        {
            "Field": "host-header",
            "Values": [host_header_pattern],
        }
    ]
    http_rule = elbv2_client.create_rule(
        ListenerArn=http_listener_arn,
        Conditions=conditions,
        Actions=[
            {
                "Type": "redirect",
                "RedirectConfig": {
                    "Protocol": "HTTPS",
                    "Port": "443",
                    "StatusCode": "HTTP_301",
                },
            },
        ],
        Priority=priority,
    )

    https_rule = elbv2_client.create_rule(
        ListenerArn=https_listener_arn,
        Conditions=conditions,
        Actions=[
            {
                "Type": "forward",
                "TargetGroupArn": target_group_arn,
            },
        ],
        Priority=priority,
    )

    http_rule_arn = http_rule["Rules"][0]["RuleArn"]
    https_rule_arn = https_rule["Rules"][0]["RuleArn"]
    return http_rule_arn, https_rule_arn


def get_latest_task_definition_revision(
    ecs_client: ECSClient,
    task_definition_arn: str,
) -> int:
    """
    Returns the latest revision of a task definition
    """
    task_definition = ecs_client.describe_task_definition(
        taskDefinition=task_definition_arn
    )
    return task_definition["taskDefinition"]["revision"]


def create_runtime_service(
    ecs_client: ECSClient,
    cluster: str,
    service_name: str,
    task_definition_arn: str,
    security_groups: list[str],
    subnets: list[str],
    https_target_group_arn: str,
):
    latest_task_revision = get_latest_task_definition_revision(
        ecs_client, task_definition_arn
    )
    latest_task_definition_arn = f"{task_definition_arn}:{latest_task_revision}"

    service = ecs_client.create_service(
        cluster=cluster,
        serviceName=service_name,
        taskDefinition=latest_task_definition_arn,
        desiredCount=1,
        launchType="FARGATE",
        networkConfiguration={
            "awsvpcConfiguration": {
                "subnets": subnets,
                "securityGroups": security_groups,
                "assignPublicIp": "ENABLED",
            }
        },
        loadBalancers=[
            {
                "targetGroupArn": https_target_group_arn,
                "containerName": "runtime",
                "containerPort": 80,
            },
        ],
    )

    return service["service"]["serviceArn"]
