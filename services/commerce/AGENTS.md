# Development conventions

- This repository is a public source/demo snapshot. Keep deployment credentials, customer/order records, personal references and runtime state out of Git.
- Use synthetic fixtures and reserved example domains. Do not infer payment success from a redirect, UI state or mock test.
- Preserve existing product behavior and public design language. Review layout balance, alignment, spacing and desktop/mobile responsiveness before UI handoff.
- Keep production deployment and live payment operations outside the public demo workflow.
- Run the relevant local checks and describe any unverified behavior accurately.
