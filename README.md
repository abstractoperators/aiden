<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/abstractoperators/aiden">
    <img src="images/aiden_logo.png" alt="Logo" width="400" height="400">
  </a>

  <h3 align="center">aiden</h3>

  <p align="center">
    High Performance Onchain AI Agents
    <br />
    <a href="https://github.com/abstractoperators/aiden"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/abstractoperators/aiden">View Demo</a>
    ·
    <a href="https://github.com/abstractoperators/aiden/issues">Report Bug</a>
    ·
    <a href="https://github.com/abstractoperators/aiden/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

Developed by Abstract Operators and powered by Sei, AIDEN ([A]gent [I]ntegration & [D]eployment [EN]gine) is an AI Agent Platform for users to create, integrate, interact with, and deploy a diverse ecosystem of High Performance AI Agents with no-code/low-code UI/UX on the Sei blockchain - a world scale EVM Layer-1 blockchain.

<!--[![Product Name Screen Shot][product-screenshot]](https://example.com)-->

### Built With

- [elizaos] (https://www.elizaos.ai/)
- [prometheus](https://prometheus.io/docs/instrumenting/clientlibs/)
- [celery](https://docs.celeryq.dev/en/stable/getting-started/introduction.html)
- [redis](https://redis.io/cloud/)

<!-- Core Features -->

<!-- KEY COMPONENTS -->

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

Secrets

Locally, all secrets may be placed in their appropriate `.env` files. Reference and maintain the appropriate `.env.example`.

It is important to maintain example `.env` files for each environment. They are the source of insensitive secrets for image builds. However, only insensitive secrets may be placed in these example files.
Sensitive variables are stored in AWS Secrets Manager. Add sensitive variables, and update the appropriate task definition to load the secret into the container at runtime.

### Installation

Install `pnpm` and `node`

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Install Node
nvm install 23

# Verify the Node.js version: Should be the same
node -v
nvm current

# Verify node package manager version (npm)
npm -v

npm install -g pnpm@latest-10

```

eliza

```bash
git submodule update --init --recursive --depth 1

# To update commit on eliza
cd eliza
git pull origin main
git checkout # git checkout $(git describe --tags --abbrev=0) for latest release
cd ..
git add eliza
git commit
```

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/abstractoperators/aiden/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->

## Contact

Kent Gang - [@abstractoperant](https://x.com/abstractoperant)

Project Link: [https://github.com/abstractoperators/aiden](https://github.com/abstractoperators/aiden)

<!-- ACKNOWLEDGEMENTS -->

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/abstractoperators/aiden.svg?style=for-the-badge
[contributors-url]: https://github.com/abstractoperators/aiden/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/abstractoperators/aiden.svg?style=for-the-badge
[forks-url]: https://github.com/abstractoperators/aiden/network/members
[stars-shield]: https://img.shields.io/github/stars/abstractoperators/aiden.svg?style=for-the-badge
[stars-url]: https://github.com/abstractoperators/aiden/stargazers
[issues-shield]: https://img.shields.io/github/issues/abstractoperators/aiden.svg?style=for-the-badge
[issues-url]: https://github.com/abstractoperators/aiden/issues
[license-shield]: https://img.shields.io/github/license/abstractoperators/aiden.svg?style=for-the-badge
[license-url]: https://github.com/abstractoperators/aiden/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/kentgang/
