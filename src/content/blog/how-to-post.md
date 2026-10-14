---
title: How to add a post
description: The one file a post is, what the email looks like, and how it goes out.
date: 2026-10-11
draft: true
---

This file stays a draft. Copy it to a new name, which becomes the address: `my-post.md` is /blog/my-post.

## Writing

Write Markdown. **Bold**, [links](https://wrenautomation.com), lists and images all work. Put images in `public/blog/` and link them as `/blog/name.png`. On the page they rise in as the reader scrolls to them.

For steps that come in one by one, a boxed note, a before and after, a figure that builds as you scroll or a sourced number, name the file `.mdx`. `how-to-animate.mdx` shows each one.

## Going live

1. Set `draft: false` and the date. Push to main and the post is up.
2. Check the email: `wren newsletter send my-post --test you@wrenautomation.com`.
3. Send it: `wren newsletter send my-post`, which shows who gets it, then `--yes`.

The email is this file as plain text. Each image becomes a line that links to the page.
