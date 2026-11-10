---
title: relay
summary: 'A Claude Code plugin that takes a feature from PRD to pull request, with a writer and a reviewer agent at every stage.'
tags:
  - claude-code
  - ai-agents
  - node
links:
  repo: https://github.com/fabiombarreto/PRPs-agentic-eng
year: '2026'
featured: true
order: 1
status: active
---

The repository is a fork of Wirasm/prp. relay is the plugin I built inside it.

## The problem

Getting an AI agent from an idea to a pull request takes more than one prompt. It needs a spec to work from, a plan someone checked, and a clear signal that the work is done.

## How it works

relay is a Claude Code plugin that takes a feature through the same stages every time:

1. An interactive PRD, written with me in a short Q&A.
2. A plan, then a plan review.
3. The implementation, then a code review.
4. A test run with an auto-correction loop that has a budget.

Every stage has a writer agent and a reviewer agent, and nothing moves on until the reviewer approves. Changes wait in an isolated worktree until I merge them. A validation suite checks the plugin itself.

This site is built with relay, one stage at a time.

## What I learned

I audited 270 review runs. Each reviewer's feedback was passed along to the next attempt, but no writer agent ever read it, so every retry started from scratch. Now each writer reads the feedback and fixes only what failed. The lesson I keep: check that the next step actually reads what the last one produced.
