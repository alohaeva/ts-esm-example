// Default export (a class) alongside a named export in the same file.
// Import both at once: import Greeter, { formatGreeting } from './greeting.js'
// Import only the named export: import { formatGreeting } from './greeting.js'

import type { User } from './types.js';

export default class Greeter {
  constructor(private readonly prefix: string = 'Hello') {}

  greet(user: User): string {
    return `${this.prefix}, ${user.name}!`;
  }

  greetMany(users: User[]): string[] {
    return users.map((u) => this.greet(u));
  }
}

export function formatGreeting(name: string, greeting: string): string {
  return `[${new Date().toISOString()}] ${greeting}, ${name}!`;
}
