---
title: Praesto Sum
summary: 'A personal assistant for one user: tasks and Google Calendar in one installable app, on Cloudflare Workers and React 19.'
tags:
  - typescript
  - react
  - cloudflare-workers
links:
  repo: https://github.com/fabiombarreto/praesto-sum
year: '2026'
featured: true
order: 3
status: in development
---

## What it is

Praesto Sum is a personal assistant for one user. It puts tasks and Google Calendar in one app you install.

## Why one user

I built it for myself, to keep tasks and calendar in one place instead of a handful of apps that never talk to each other. One user keeps it small enough for one person to maintain: no accounts, no sign-up, one token protecting the whole API.

## Why Cloudflare Workers

I wanted it to cost nothing and need no upkeep: no server at home, no monthly bill, nothing to patch. One Worker on Cloudflare's free plan serves the app, the API and the scheduled jobs, and the data lives in D1, Cloudflare's database.

## Installing it

It's a PWA, so there's no app store. On my phone it sits on the home screen, and on my PC it opens in its own window. One codebase serves both.

It's built with TypeScript and React 19 and still in development. Tasks and Google Calendar events already show up side by side; reminders and push notifications come next.
