# Skate Park - Demo Site (NextJS) - nextjsstarter

## Table of Contents

- [Overview](#overview)
- [Skateboard Calculator](#skateboard-calculator)
- [Developer Expectations](#developer-expectations)
- [Preconditions](#preconditions)
- [Build and run site locally](#build-and-run-site-locally)
- [Add Editing host to XM Cloud](#add-editing-host-to-xm-cloud)
- [Documentation](#documentation)

## Overview

Skate Park is a simple website with sample Component implementation showcasing data source handling and other essentials. This demo site is built to showcase XM Cloud capabilities using the Content SDK.

## Skateboard Calculator

Open `/skateboard` to choose a deck, trucks, wheels, bearings, optional assembly,
and fictional insurance. The existing carousel is unchanged.

The Sitecore rendering component name is **SkateboardCalculator**, with variant
**Default**. It is registered by `npm run sitecore-tools:generate-map`. To place
it on a CMS page, create or use a JSON rendering with that component name and add
it to an allowed placeholder. No datasource is needed: this demo uses an in-code
catalog, not CMS product content. No serialized authoring items are added.

- `GET /api/skateboard/catalog`: options, prices in integer cents, defaults, and terms.
- `POST /api/skateboard/quote`: validates the selection and calculates server-owned prices.
- `/skateboard?view=agent`: server-rendered tables of every option and the selected quote.

Recognized AI User-Agents automatically receive the agent rendering. The agent
representation needs neither interaction nor JavaScript to expose the prices.
Both renderings use the same catalog and price calculation. The calculator calls
the quote API on changes, cancels superseded requests, and hides stale totals on
failure. Successful selections are preserved in shareable URL parameters.

Example request:

```sh
curl http://localhost:3000/api/skateboard/quote \
    -H 'Content-Type: application/json' \
    -d '{"deck":"street","trucks":"standard","wheels":"street","bearings":"standard","assembly":true,"insurance":true}'
```

This selection costs EUR 157.00 once, plus EUR 4.99 per month separately.
All demo prices include VAT. Trucks and wheels are complete sets; griptape and
hardware are mandatory. The demo assumes matched trucks for each deck and allows
every catalog combination. Insurance is fictional and cannot be purchased; its
terms are visible in both renderings. There is no checkout or real policy.

Run focused tests with:

```sh
npm run test:unit -- --runInBand --coverage=false --runTestsByPath src/__tests__/lib/skateboard.test.ts src/__tests__/components/skateboard-calculator.test.tsx
```

## Developer Expectations

* Tailwind-based styling (Shadcn)
* Personalized homepage via URL parameters
* Modular components for reuse
* Localization support for English (en) and Canadian English (en-CA)

## Preconditions

1. You have deployed your XM Cloud environment already. If not follow this link: [Deploy a Project and Environment](https://doc.sitecore.com/xmc/en/developers/xm-cloud/deploy-a-project-and-environment.html)

## Build and run site locally

1. Clone the repository (if not yet done)
    ```git clone https://github.com/Sitecore/xmcloud-starter-js```
2. Starting from the root of the repository navigate to site app folder
    ```cd examples\kit-nextjs-skate-park\```
3. Copy the environment file ```.env.remote.example```
4. Rename the copied file to ```.env.local```
5. Edit ```.env.local``` and provide a value for ```SITECORE_EDGE_CONTEXT_ID```, ```NEXT_PUBLIC_DEFAULT_SITE_NAME```, ```NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID```, ```SITECORE_EDITING_SECRET```. (More info: [Environment variables in XM Cloud](https://doc.sitecore.com/xmc/en/developers/xm-cloud/get-the-environment-variables-for-a-site.html)) Optionally set ```NEXT_PUBLIC_SITE_URL``` or ```NEXT_PUBLIC_BASE_URL``` to your public site origin when server-rendered code must build absolute URLs without the request ```Host``` header (see ```.env.remote.example```).

6. Install dependencies:
   from ```kit-nextjs-skate-park``` run ```npm install```
7. Run the site locally:
    ```npm run dev```
8. Access the site:
Visit http://localhost:3000 in your browser.

## Add Editing host to XM Cloud

If you have not enabled the split deployment feature your editing hosts are automatically created based on the xmcloud.build.json if enabled is set to true. The following steps are not required. Only if you have enabled the split deployment feature, continue with the next steps.

1. Go to Sitecore Cloud Portal https://portal.sitecorecloud.io
2. Open XM Cloud Deploy
3. Select Project that has been deployed
4. Switch to tab "Editing Hosts"
5. Click "Add editing host"
6. Provide Editing host name  ```nextjsstarter``` as per xmcloud.build.json
7. Check if the link to authoring environment is set correctly (should be by default)
8.  Check if the source code provider is set correctly (should be by default)
9. Check if the GitHub Account is set correctly (should be by default)
10. Check if repository is set correctly (should be by default)
11. Check if Branch is set correctly (should be by default)
12. Set the Auto deploy option (recommended)
13. No custom environment variables are required
14. Click "Save"
15. On the new editing host click the ... and hit "Build and deploy"

Additional Info: You do not have to create rendering host items in XM Cloud as those are created automatically for you when creating a rendering host. Mapping of sites using site templates to editing hosts is also done automatically.

## Documentation

[Documentation](https://doc.sitecore.com/xmc/en/developers/content-sdk/sitecore-content-sdk-for-xm-cloud.html)
