"""Invoke the user's configured tx_cloud MCP server without copying credentials."""
import argparse
import asyncio
import json
import os
from pathlib import Path
import shutil
import sys
from datetime import timedelta
import tomli
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=['list', 'call'])
    parser.add_argument('--tool')
    parser.add_argument('--input', help='JSON argument file')
    args = parser.parse_args()
    with (Path.home() / '.codex' / 'config.toml').open('rb') as f:
        config = tomli.load(f)['mcp_servers']['tx_cloud']
    command = shutil.which(config['command']) or config['command']
    parameters = StdioServerParameters(command=command, args=config.get('args', []), env={**os.environ, **config.get('env', {})})
    # Some npm launchers log process arguments; never echo the launcher's stderr.
    with open(os.devnull, 'w') as quiet:
        async with stdio_client(parameters, errlog=quiet) as streams:
            async with ClientSession(*streams) as session:
                await session.initialize()
                if args.operation == 'list':
                    result = await session.list_tools()
                else:
                    payload = json.loads(Path(args.input).read_text(encoding='utf-8-sig'))
                    result = await session.call_tool(args.tool, payload, read_timeout_seconds=timedelta(minutes=15))
                print(result.model_dump_json(indent=2))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    asyncio.run(main())
