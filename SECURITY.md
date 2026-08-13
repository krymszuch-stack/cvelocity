# Security Policy

## Overview & Commitment

Security and data privacy are foundational principles of **CVELOCITY**. CVELOCITY stores user CV profiles and MasterVault data locally in browser `localStorage`. Authentication passwords are hashed on the client side using PBKDF2 (SHA-256) with 600,000 iterations and a unique salt per account. Remote AI features send job description texts and CV highlights strictly over HTTPS to serverless backend endpoints powered by the Google Gemini API, where requests are processed statelessly without central database storage.

---

## Supported Versions

We provide security updates and patches for the following project versions:

| Version | Supported          | Security Notes                                            |
| ------- | ------------------ | --------------------------------------------------------- |
| 1.0.x   | :white_check_mark: | Current Main Release (Web Crypto API AES-256-GCM + PBKDF2) |
| < 1.0   | :x:                | Pre-release development versions (Unsupported)           |

---

## Reporting a Vulnerability

We take all security reports seriously and appreciate the open-source community's efforts in keeping CVELOCITY safe.

### How to Report
If you discover a potential security vulnerability (e.g., encryption flaws, XSS vectors, or data exposure risks), **please do NOT open a public GitHub Issue**. 

Instead, report it responsibly via email:

* **Security Contact:** Adrian Koziński
* **Email:** `krymszuch00@outlook.com`
* **Subject Line:** `[SECURITY VULNERABILITY] CVELOCITY - <Brief Description>`

### What to Include in Your Report
To help us triage and resolve the issue quickly, please include:
1. A detailed description of the vulnerability and its potential impact.
2. Step-by-step instructions or a Proof of Concept (PoC) to reproduce the issue.
3. The affected component, file, or endpoint.
4. Any potential mitigations or suggested fixes.

---

## Our Response Process & SLAs

When a vulnerability is reported:

1. **Initial Acknowledgment:** You will receive an email confirmation within **24 to 48 hours** confirming receipt of your report.
2. **Triage & Assessment:** Our team will investigate and assess the report within **5 business days** to confirm the severity and impact.
3. **Patch & Advisory:** If accepted, a security patch will be prepared and released within **14 calendar days** (or sooner for critical vulnerabilities).
4. **Public Disclosure:** Once the fix is verified and deployed, a public security release advisory will be published. With your permission, we will acknowledge your contribution in our release notes.

---

## Responsible Disclosure Policy

We kindly ask researchers to:
* Give us reasonable time to investigate and issue a patch before publicly disclosing the vulnerability.
* Avoid accessing, modifying, or destroying user data or privacy.
* Act in good faith to avoid service disruption or degradation.

Thank you for helping keep **SkillVault** and its users secure!
