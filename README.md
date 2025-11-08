<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">NestJS Libraries Monorepo</h1>

<p align="center">
  Collection of NestJS libraries by Ojie Permana
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ojiepermana/nest-generator"><img src="https://img.shields.io/npm/v/@ojiepermana/nest-generator.svg" alt="nest-generator version" /></a>
  <a href="https://www.npmjs.com/package/@ojiepermana/nest"><img src="https://img.shields.io/npm/v/@ojiepermana/nest.svg" alt="nest version" /></a>
  <a href="https://github.com/ojiepermana/nest/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@ojiepermana/nest.svg" alt="License" /></a>
</p>

## 📦 Published Libraries

### [@ojiepermana/nest-generator](https://www.npmjs.com/package/@ojiepermana/nest-generator)

NestJS Generator Library - Code generator and template management utilities.

```bash
npm install @ojiepermana/nest-generator
```

### [@ojiepermana/nest](https://www.npmjs.com/package/@ojiepermana/nest)

NestJS Core Library - Core utilities and common modules.

```bash
npm install @ojiepermana/nest
```

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Build Libraries

```bash
# Build all libraries
npm run build:all-libs

# Build specific library
npm run build:generator
npm run build:nest
```

### Publish to npm

```bash
# Interactive publish
./scripts/publish-libs.sh

# Or use npm scripts
npm run publish:all-libs
```

📖 **See:** [QUICK-PUBLISH.md](./QUICK-PUBLISH.md) for quick guide or [PUBLISHING.md](./PUBLISHING.md) for complete documentation.

## 📚 Documentation

- [Publishing Guide](./PUBLISHING.md) - Complete guide untuk publish libraries
- [Quick Publish Guide](./QUICK-PUBLISH.md) - Panduan cepat publish
- [Libraries Documentation](./LIBRARIES.md) - Dokumentasi libraries

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
npm install
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
