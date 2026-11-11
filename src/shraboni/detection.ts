import type { Framework, LanguageStat, SourceFile } from '../shared/types';

const languageByExtension: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
  mjs: 'JavaScript', cjs: 'JavaScript', py: 'Python', java: 'Java',
  php: 'PHP', go: 'Go', rs: 'Rust', rb: 'Ruby', cs: 'C#',
  c: 'C', h: 'C', cpp: 'C++', cc: 'C++', html: 'HTML',
  css: 'CSS', scss: 'SCSS', vue: 'Vue', svelte: 'Svelte',
  sql: 'SQL', kt: 'Kotlin', swift: 'Swift', dart: 'Dart',
  sh: 'Shell', ipynb: 'Jupyter Notebook',
};

export function detectLanguages(
  files: SourceFile[],
  githubBytes?: Record<string, number>,
): LanguageStat[] {
  // GitHub's language sizes are better than guessing from extensions.
  // For ZIP uploads we use the sizes of recognizable source files instead.
  const totals: Record<string, number> = {};

  if (githubBytes && Object.keys(githubBytes).length > 0) {
    Object.assign(totals, githubBytes);
  } else {
    for (const file of files) {
      const language = languageByExtension[file.extension];
      if (language) totals[language] = (totals[language] ?? 0) + file.size_bytes;
    }
  }

  const totalBytes = Object.values(totals).reduce((sum, size) => sum + size, 0);

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({
      language_id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      language_name: name,
      bytes,
      percentage: totalBytes ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    }));
}

interface FrameworkRule {
  name: string;
  category: string;
  file: RegExp;
  contains?: RegExp;
}

// A few popular stacks need only a specific filename (like angular.json).
// Most need an actual dependency/config reference to avoid false detections.
const frameworkRules: FrameworkRule[] = [
  { name: 'React', category: 'Frontend', file: /package\.json$/i, contains: /["']react["']\s*:/i },
  { name: 'Next.js', category: 'Frontend', file: /(^|\/)next\.config\.[cm]?[jt]s$|package\.json$/i, contains: /["']next["']\s*:|nextConfig/i },
  { name: 'Vue', category: 'Frontend', file: /package\.json$|vue\.config\./i, contains: /["']vue["']\s*:|@vitejs\/plugin-vue/i },
  { name: 'Nuxt', category: 'Frontend', file: /nuxt\.config\.|package\.json$/i, contains: /["']nuxt["']\s*:|defineNuxtConfig/i },
  { name: 'Angular', category: 'Frontend', file: /angular\.json$|package\.json$/i, contains: /@angular\/core|["']projects["']\s*:/i },
  { name: 'Svelte', category: 'Frontend', file: /svelte\.config\.|package\.json$/i, contains: /["']svelte["']\s*:|svelte\//i },
  { name: 'SvelteKit', category: 'Frontend', file: /svelte\.config\.|package\.json$/i, contains: /@sveltejs\/kit/i },
  { name: 'Vite', category: 'Build', file: /vite\.config\.|package\.json$/i, contains: /["']vite["']\s*:|defineConfig/i },
  { name: 'Tailwind CSS', category: 'Styling', file: /package\.json$|tailwind\.config\.|\.css$/i, contains: /tailwindcss|@import\s+["']tailwindcss/i },
  { name: 'Bootstrap', category: 'Styling', file: /package\.json$|\.s?css$/i, contains: /bootstrap/i },
  { name: 'Material UI', category: 'Styling', file: /package\.json$/i, contains: /@mui\/material/i },
  { name: 'Express', category: 'Backend', file: /package\.json$/i, contains: /["']express["']\s*:/i },
  { name: 'NestJS', category: 'Backend', file: /package\.json$|nest-cli\.json$/i, contains: /@nestjs\/core|@nestjs\/cli/i },
  { name: 'Fastify', category: 'Backend', file: /package\.json$/i, contains: /["']fastify["']\s*:/i },
  { name: 'Koa', category: 'Backend', file: /package\.json$/i, contains: /["']koa["']\s*:/i },
  { name: 'Django', category: 'Backend', file: /requirements.*\.txt$|pyproject\.toml$|manage\.py$/i, contains: /django|DJANGO_SETTINGS_MODULE/i },
  { name: 'Flask', category: 'Backend', file: /requirements.*\.txt$|pyproject\.toml$|app\.py$/i, contains: /flask/i },
  { name: 'FastAPI', category: 'Backend', file: /requirements.*\.txt$|pyproject\.toml$/i, contains: /fastapi/i },
  { name: 'Laravel', category: 'Backend', file: /(^|\/)artisan$|composer\.json$/i, contains: /laravel\/framework|laravel/i },
  { name: 'Symfony', category: 'Backend', file: /composer\.json$/i, contains: /symfony\/framework-bundle/i },
  { name: 'Spring Boot', category: 'Backend', file: /pom\.xml$|build\.gradle(\.kts)?$/i, contains: /spring-boot/i },
  { name: 'Ruby on Rails', category: 'Backend', file: /(^|\/)Gemfile$|config\/application\.rb$/i, contains: /rails/i },
  { name: 'ASP.NET Core', category: 'Backend', file: /\.csproj$|Program\.cs$/i, contains: /Microsoft\.AspNetCore|WebApplication\.CreateBuilder/i },
  { name: 'Flutter', category: 'Mobile', file: /pubspec\.yaml$/i, contains: /flutter/i },
  { name: 'React Native', category: 'Mobile', file: /package\.json$/i, contains: /react-native/i },
  { name: 'Expo', category: 'Mobile', file: /package\.json$|app\.json$/i, contains: /["']expo["']\s*:|expo\//i },
  { name: 'Electron', category: 'Desktop', file: /package\.json$/i, contains: /["']electron["']\s*:/i },
  { name: 'Tauri', category: 'Desktop', file: /tauri\.conf\.json$|Cargo\.toml$/i, contains: /tauri/i },
  { name: 'Prisma', category: 'Database', file: /schema\.prisma$|package\.json$/i, contains: /datasource\s+\w+|["']@prisma\/client["']\s*:/i },
  { name: 'Sequelize', category: 'Database', file: /package\.json$/i, contains: /["']sequelize["']\s*:/i },
  { name: 'TypeORM', category: 'Database', file: /package\.json$/i, contains: /["']typeorm["']\s*:/i },
  { name: 'Mongoose', category: 'Database', file: /package\.json$/i, contains: /["']mongoose["']\s*:/i },
  { name: 'Jest', category: 'Testing', file: /jest\.config\.|package\.json$/i, contains: /["']jest["']\s*:|jest\.config/i },
  { name: 'Vitest', category: 'Testing', file: /vitest\.config\.|package\.json$/i, contains: /["']vitest["']\s*:|vitest/i },
  { name: 'Playwright', category: 'Testing', file: /playwright\.config\.|package\.json$/i, contains: /@playwright\/test|playwright/i },
  { name: 'Cypress', category: 'Testing', file: /cypress\.config\.|package\.json$/i, contains: /["']cypress["']\s*:|defineConfig/i },
  { name: 'Docker', category: 'DevOps', file: /(^|\/)Dockerfile$|(^|\/)docker-compose.*\.ya?ml$/i },
  { name: 'GitHub Actions', category: 'DevOps', file: /(^|\/)\.github\/workflows\/.*\.ya?ml$/i },
];

export function detectFrameworks(files: SourceFile[]): Framework[] {
  const found = new Map<string, Framework>();

  for (const file of files) {
    for (const rule of frameworkRules) {
      if (found.has(rule.name) || !rule.file.test(file.file_path)) continue;
      if (rule.contains && !rule.contains.test(file.content ?? '')) continue;

      found.set(rule.name, {
        framework_id: rule.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        framework_name: rule.name,
        category: rule.category,
        detected_from: file.file_path,
      });
    }
  }

  return Array.from(found.values());
}
