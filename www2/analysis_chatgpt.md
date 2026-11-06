**My candid assessment: Apertus has outgrown its navigation.** The site explains the project’s identity and principles more clearly than it explains how someone can try it, examine its research, or contribute. I would prioritize a navigation and content restructuring before commissioning a broad visual redesign.

I’ve put the review into a **13-page report**, including specific findings, a proposed navigation structure, homepage copy, a page migration map, contribution pathways, accessibility requirements, and implementation priorities.

**PDF for circulation**

[Apertus_website_navigation_review\.pdf](https://chatgpt.com/library?file_id=libfile_54dd5ae81de08191be004b45609bb7a8&account_id=0052044e-c953-4068-9ada-b4e016c07e46)

**Editable Word version**

[Apertus_website_navigation_review\.docx](https://chatgpt.com/library?file_id=libfile_8cfe448ef5e48191a694ed68da175c67&account_id=0052044e-c953-4068-9ada-b4e016c07e46)

## The central criticism

The current structure asks newcomers to understand the Apertus ecosystem before it helps them enter it.

A visitor should be able to distinguish these intentions immediately:

- I want to **use something built with Apertus**.
- I want to **choose or download a model**.
- I want to **connect an API or run it myself**.
- I want to **understand and inspect the research**.
- I want to **help improve a project**.

At present, those routes are spread across labels whose meanings overlap. “Get Started” primarily leads to inference providers. “Documentation” primarily leads to model downloads, policies, and repositories. Applications appear under “Showcase,” while procedural documentation lives in a separate area. [Apertus](https://apertus-ai.org/pages/get-started/?utm_source=chatgpt.com)

That is the most consequential problem. The public invitation is broader than the route the site provides.

## The navigation I recommend

Use **Models · Build · Research · Contribute · About**, with a prominent **Try Apertus** button. Keep **Docs** immediately available as a utility link.

| Entry | What visitors should find |
|---|---|
| **Try Apertus** — prominent button | Ready-to-use apps and demos, with clear access requirements and operators |
| **Models** | Current releases, smaller models, comparisons, languages and limitations, downloads, release history |
| **Build** | API providers, first API request, running locally, deployment, integrations, fine-tuning |
| **Research** | Papers, data, methods, evaluations, and material needed to reproduce or extend results |
| **Contribute** | Supported projects, wanted tasks, documentation improvements, evaluation, dataset guidance, app submissions |
| **About** | Purpose, institutions and team, governance, Charter, roadmap, news, media and contact |

The distinction between **Models**, **Build**, and **Docs** needs discipline:

- **Models** explains what a release is and whether it fits.
- **Build** helps someone accomplish a technical task.
- **Docs** provides the maintained instructions and reference material.

These should cross-link, with one canonical description of each release or artifact.

I would move **Contact** out of the primary navigation while keeping it readily available in About, the footer, and relevant support contexts. I would also give people installing an existing desktop app a route from **Try Apertus**, so local use does not appear to require programming.

## Where the current site needs the strongest intervention

### 1. Make the primary action deliver a first experience

A curious visitor can reasonably interpret “Get Started” as the quickest way to try Apertus. Instead, that route introduces hosting providers and infrastructure choices. The Quickstart then sends cloud users back toward that directory and provider documentation. [Apertus](https://apertus-ai.org/pages/get-started/?utm_source=chatgpt.com)

**Try Apertus should lead directly to apps and demos.** Give technical visitors separate, explicit routes to an API and local deployment.

This does not require building an official chatbot. A well-maintained directory can serve the purpose, provided it clearly identifies independently operated services.

### 2. Make app listings useful for choosing, rather than merely discovering

The current cards do not make a consistent promise about the destination. For example, Lumo leads to a partnership article, while Open Data Editor leads to its documentation homepage. [Apertus](https://apertus-ai.org/pages/get-showcase/?utm_source=chatgpt.com)

Use explicit actions such as **Open Public AI chat**, **Download Open Data Editor**, and **Try the browser demo**. Keep partnership stories and case studies as secondary reading.

Each listing should tell a visitor:

- What they can do.
- Who operates it.
- Whether it is an application, demonstration, or experiment.
- Whether an account, installation, payment, or particular device is required.
- Which Apertus version it uses and whether they must select it.
- Where to find privacy information and source code, where available.
- When the listing was last checked.

The model’s openness, the application’s source license, and the operator’s data practices are separate questions. The directory should help visitors understand each one.

### 3. Give contribution the prominence and practical support it deserves

The existing Contributing area is organized around subjects such as evaluation, fine-tuning, governance, licensing, safety, and uploading datasets. Those are useful references, but they do not yet form a clear invitation to a first task. [Apertus](https://apertus-ai.org/docs/tech/?utm_source=chatgpt.com)

**A Contribute page must answer “What help is useful now?”**

For every promoted opportunity, show the task, prerequisites, expected submission, receiving route, and person or team responsible for review. Include documentation, language expertise, evaluation, and feedback alongside code.

There are already concrete projects to surface: the website and documentation repository, data reconstruction scripts, and the Apertus conversation-format library. The report maps these to possible contribution routes, while distinguishing proposed tasks from work maintainers currently advertise. [GitHub](https://github.com/swiss-ai/www-apertus?utm_source=chatgpt.com)

Do not launch a prominent invitation to contribute unless someone can respond. That receiving process is part of the communications promise.

### 4. Present research as something people can understand and reuse

The Research page contains a substantial publication collection. However, it is presented under a news-oriented heading, and its links behave inconsistently: the current technical report goes directly to a paper, while the original report first opens an announcement. [Apertus](https://apertus-ai.org/pages/research/?utm_source=chatgpt.com)

Organize the material into a few understandable topics, then connect each major result to its:

- Research question and plain-language finding.
- Limitations and publication status.
- Paper.
- Code.
- Data or reconstruction procedure.
- Evaluation artifacts and citation.

An interested non-specialist should understand why a result matters. A researcher should be able to reach the reusable outputs without assembling a trail across several pages.

### 5. Put capability and access information where people make decisions

Some useful qualifications are currently separated from the relevant choice.

The FAQ distinguishes broad language representation in training from conversational capability in a few dozen languages. It also explains model-download gating; the official 1.5 8B download requires sign-in, acceptance of conditions, and sharing contact information with the repository authors. [Apertus](https://apertus-ai.org/docs/faq/?utm_source=chatgpt.com)

Bring those explanations closer to model selection and download actions.

Provider listings also need to distinguish **model capabilities from endpoint capabilities**. For example, Swisscom’s inspected Apertus 1.5 70B documentation says its current deployment does not support thinking mode. Someone choosing a provider needs that distinction before committing to the route. [ESC Docs](https://docs.cloud.swisscom.ch/guide/cloud-services/aip/models/apertus-1_5_70B?utm_source=chatgpt.com)

Mark undocumented features as unverified. Do not fill gaps by assuming that every deployment exposes everything the underlying model can do.

### 6. Fix the small defects that weaken confidence

I confirmed that Showcase has the same browser title as Get Started. Desktop inspection also identified inconsistent heading structure, a newsletter email field without an associated label, and an unnamed image link on the Research page. The report records these as specific observations, without turning them into a sitewide accessibility score.

There is also a concrete documentation consistency issue: the SGLang guide’s start commands identify an older model, while its subsequent test request identifies the 1.5 model. The guide acknowledges ongoing integration work, but its example still needs a consistent scope. I did not execute it, so this is a verified textual mismatch rather than a claimed runtime failure. [Apertus](https://apertus-ai.org/pages/get-showcase/?utm_source=chatgpt.com)

A better menu will expose more content. That makes content maintenance more important.

## What inclusive presentation should mean here

I would make the invitation more explicit and less dependent on technical confidence.

Lead with what Apertus is and what people can do with it. Explain specialist terms when they become relevant. Keep Swiss provenance visible, while explicitly welcoming participation from outside Switzerland and outside academia.

I would also treat these as three different commitments:

1. **Linguistic inclusion in model development.**
2. **Useful model performance in particular languages.**
3. **Accessible website and application interfaces in those languages.**

A large training-language count does not answer the other two questions.

For website localization, start with a maintainable selection of public-facing pages. English, German, French, and Italian are a reasonable proposal to assess against audience needs and editorial capacity; involve Romansh speakers in deciding useful coverage. A smaller set of current, reviewed translations is more useful than an extensive collection that drifts out of date.

For technical accessibility, make keyboard navigation, visible focus, meaningful link names, form labels, narrow-screen reflow, enlarged text, and assistive-technology testing part of the release requirements. WCAG 2.2 provides the appropriate reference framework. [w3.org](https://www.w3.org/TR/WCAG22/?utm_source=chatgpt.com)

## What I would prioritize

**Immediate repairs:** correct titles and accessible names, resolve the mixed-version example, clarify external link actions, and expose direct routes to trying and contributing.

**Next focused release:** introduce the proposed navigation and landing pages, rewrite the homepage opening, standardize app and provider records, and connect models to research artifacts. Assign content owners and preserve existing deep links through an explicit migration plan.

**Then validate and expand:** test whether people can find an app, an appropriate endpoint, a suitable local model, a research artifact, and a contribution task. Use the results to guide localization, filters, search, and additional contribution programmes.

Measure successful navigation carefully. An outbound app click demonstrates referral intent; it does not prove that someone successfully used Apertus. A repository visit is not a contribution.

The report was prepared from the live public site and selected linked resources on **6 November 2026**. It includes desktop inspection, but no user analytics, interviews, mobile device testing, full accessibility audit, or paid endpoint testing. Its strongest recommendations concern observable routing and content problems; the predicted effects on participation remain hypotheses to validate.
