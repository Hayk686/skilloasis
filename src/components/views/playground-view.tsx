'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Terminal,
  Play,
  Trash2,
  Sparkles,
  Loader2,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Copy,
  Code2,
  Zap,
} from 'lucide-react'
import { PageSection, SectionHeader, GlassCard } from '@/components/ui-blocks'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { useTranslations, type LocalizedText } from '@/lib/i18n-client'

interface LogEntry {
  type: 'log' | 'warn' | 'error' | 'info'
  args: string[]
}

interface Challenge {
  id: ChallengeId
  title: LocalizedText
  desc: LocalizedText
  code: LocalizedText
  hint: LocalizedText
}

type ChallengeId = 'fizzbuzz' | 'fib' | 'palindrome' | 'sort'

const localized = (ru: string, en: string, hy: string): LocalizedText => ({ ru, en, hy })

type PlaygroundLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'

const LANGUAGE_DETAILS: Record<PlaygroundLanguage, { label: string; extension: string }> = {
  javascript: { label: 'JavaScript', extension: 'js' },
  typescript: { label: 'TypeScript', extension: 'ts' },
  python: { label: 'Python', extension: 'py' },
  html: { label: 'HTML / CSS', extension: 'html' },
  java: { label: 'Java', extension: 'java' },
  cpp: { label: 'C++', extension: 'cpp' },
  csharp: { label: 'C#', extension: 'cs' },
  go: { label: 'Go', extension: 'go' },
  rust: { label: 'Rust', extension: 'rs' },
}

const JAVASCRIPT_STARTER = localized(`// Добро пожаловать в песочницу Info Oasis 🚀
// Пиши JavaScript и нажми «Запустить» (Ctrl+Enter)

function greet(name) {
  return \`Привет, \${name}! Добро пожаловать в Info Oasis.\`
}

console.log(greet('друг'))

// Попробуй массивы:
const nums = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Сумма:', sum)
console.log('Среднее:', sum / nums.length)
`, `// Welcome to the Info Oasis playground 🚀
// Write JavaScript and press Run (Ctrl+Enter)

function greet(name) {
  return \`Hello, \${name}! Welcome to Info Oasis.\`
}

console.log(greet('friend'))

// Try working with arrays:
const nums = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Sum:', sum)
console.log('Average:', sum / nums.length)
`, `// Բարի գալուստ Info Oasis-ի կոդի փորձադաշտ 🚀
// Գրիր JavaScript և սեղմիր «Գործարկել» (Ctrl+Enter)

function greet(name) {
  return \`Ողջույն, \${name}։ Բարի գալուստ Info Oasis։\`
}

console.log(greet('ընկեր'))

// Փորձիր աշխատել զանգվածների հետ․
const nums = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Գումար՝', sum)
console.log('Միջին՝', sum / nums.length)
`)

const TYPESCRIPT_STARTER = localized(`// Добро пожаловать в песочницу TypeScript Info Oasis 🚀
// Пиши TypeScript и нажми «Запустить» (Ctrl+Enter)

function greet(name: string): string {
  return \`Привет, \${name}! Добро пожаловать в Info Oasis.\`
}

console.log(greet('друг'))

// Попробуй типизированные массивы:
const nums: number[] = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Сумма:', sum)
console.log('Среднее:', sum / nums.length)
`, `// Welcome to the Info Oasis TypeScript playground 🚀
// Write TypeScript and press Run (Ctrl+Enter)

function greet(name: string): string {
  return \`Hello, \${name}! Welcome to Info Oasis.\`
}

console.log(greet('friend'))

// Try typed arrays:
const nums: number[] = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Sum:', sum)
console.log('Average:', sum / nums.length)
`, `// Բարի գալուստ Info Oasis-ի TypeScript փորձադաշտ 🚀
// Գրիր TypeScript և սեղմիր «Գործարկել» (Ctrl+Enter)

function greet(name: string): string {
  return \`Ողջույն, \${name}։ Բարի գալուստ Info Oasis։\`
}

console.log(greet('ընկեր'))

// Փորձիր տիպավորված զանգվածներ․
const nums: number[] = [1, 2, 3, 4, 5]
const sum = nums.reduce((a, b) => a + b, 0)
console.log('Գումար՝', sum)
console.log('Միջին՝', sum / nums.length)
`)

const PYTHON_STARTER = localized(`# Добро пожаловать в песочницу Python Info Oasis 🚀
def greet(name: str) -> str:
    return f"Привет, {name}! Добро пожаловать в Info Oasis."

print(greet("друг"))
numbers = [1, 2, 3, 4, 5]
print("Сумма:", sum(numbers))
print("Среднее:", sum(numbers) / len(numbers))
`, `# Welcome to the Info Oasis Python playground 🚀
def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to Info Oasis."

print(greet("friend"))
numbers = [1, 2, 3, 4, 5]
print("Sum:", sum(numbers))
print("Average:", sum(numbers) / len(numbers))
`, `# Բարի գալուստ Info Oasis-ի Python փորձադաշտ 🚀
def greet(name: str) -> str:
    return f"Ողջույն, {name}։ Բարի գալուստ Info Oasis։"

print(greet("ընկեր"))
numbers = [1, 2, 3, 4, 5]
print("Գումար՝", sum(numbers))
print("Միջին՝", sum(numbers) / len(numbers))
`)

const HTML_STARTER = localized(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui; padding: 32px; background: #12091d; color: white; }
    .card { padding: 24px; border-radius: 18px; background: #261238; }
    h1 { color: #d946ef; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Привет из Info Oasis!</h1>
    <p>Измени HTML и CSS, затем нажми «Запустить».</p>
  </div>
</body>
</html>`, `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui; padding: 32px; background: #12091d; color: white; }
    .card { padding: 24px; border-radius: 18px; background: #261238; }
    h1 { color: #d946ef; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello from Info Oasis!</h1>
    <p>Edit the HTML and CSS, then press Run.</p>
  </div>
</body>
</html>`, `<!doctype html>
<html lang="hy">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: system-ui; padding: 32px; background: #12091d; color: white; }
    .card { padding: 24px; border-radius: 18px; background: #261238; }
    h1 { color: #d946ef; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Ողջույն Info Oasis-ից։</h1>
    <p>Փոխիր HTML-ն ու CSS-ը, ապա սեղմիր «Գործարկել»։</p>
  </div>
</body>
</html>`)

const JAVA_STARTER = localized(`// Добро пожаловать в песочницу Java Info Oasis 🚀
class Main {
  public static void main(String[] args) {
    String name = "друг";
    System.out.println("Привет, " + name + "! Добро пожаловать в Info Oasis.");
    int[] numbers = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int number : numbers) sum += number;
    System.out.println("Сумма: " + sum);
  }
}`, `// Welcome to the Info Oasis Java playground 🚀
class Main {
  public static void main(String[] args) {
    String name = "friend";
    System.out.println("Hello, " + name + "! Welcome to Info Oasis.");
    int[] numbers = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int number : numbers) sum += number;
    System.out.println("Sum: " + sum);
  }
}`, `// Բարի գալուստ Info Oasis-ի Java փորձադաշտ 🚀
class Main {
  public static void main(String[] args) {
    String name = "ընկեր";
    System.out.println("Ողջույն, " + name + "։ Բարի գալուստ Info Oasis։");
    int[] numbers = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int number : numbers) sum += number;
    System.out.println("Գումար՝ " + sum);
  }
}`)

const CPP_STARTER = localized(`// Добро пожаловать в песочницу C++ Info Oasis 🚀
#include <iostream>
#include <numeric>
#include <vector>

int main() {
  std::cout << "Привет! Добро пожаловать в Info Oasis.\n";
  std::vector<int> numbers{1, 2, 3, 4, 5};
  std::cout << "Сумма: " << std::accumulate(numbers.begin(), numbers.end(), 0) << '\n';
}`, `// Welcome to the Info Oasis C++ playground 🚀
#include <iostream>
#include <numeric>
#include <vector>

int main() {
  std::cout << "Hello! Welcome to Info Oasis.\n";
  std::vector<int> numbers{1, 2, 3, 4, 5};
  std::cout << "Sum: " << std::accumulate(numbers.begin(), numbers.end(), 0) << '\n';
}`, `// Բարի գալուստ Info Oasis-ի C++ փորձադաշտ 🚀
#include <iostream>
#include <numeric>
#include <vector>

int main() {
  std::cout << "Ողջույն։ Բարի գալուստ Info Oasis։\n";
  std::vector<int> numbers{1, 2, 3, 4, 5};
  std::cout << "Գումար՝ " << std::accumulate(numbers.begin(), numbers.end(), 0) << '\n';
}`)

const CSHARP_STARTER = localized(`// Добро пожаловать в песочницу C# Info Oasis 🚀
using System;
using System.Linq;

public class Program {
  public static void Main() {
    Console.WriteLine("Привет! Добро пожаловать в Info Oasis.");
    int[] numbers = { 1, 2, 3, 4, 5 };
    Console.WriteLine($"Сумма: {numbers.Sum()}");
  }
}`, `// Welcome to the Info Oasis C# playground 🚀
using System;
using System.Linq;

public class Program {
  public static void Main() {
    Console.WriteLine("Hello! Welcome to Info Oasis.");
    int[] numbers = { 1, 2, 3, 4, 5 };
    Console.WriteLine($"Sum: {numbers.Sum()}");
  }
}`, `// Բարի գալուստ Info Oasis-ի C# փորձադաշտ 🚀
using System;
using System.Linq;

public class Program {
  public static void Main() {
    Console.WriteLine("Ողջույն։ Բարի գալուստ Info Oasis։");
    int[] numbers = { 1, 2, 3, 4, 5 };
    Console.WriteLine($"Գումար՝ {numbers.Sum()}");
  }
}`)

const GO_STARTER = localized(`// Добро пожаловать в песочницу Go Info Oasis 🚀
package main

import "fmt"

func main() {
  fmt.Println("Привет! Добро пожаловать в Info Oasis.")
  numbers := []int{1, 2, 3, 4, 5}
  sum := 0
  for _, number := range numbers { sum += number }
  fmt.Println("Сумма:", sum)
}`, `// Welcome to the Info Oasis Go playground 🚀
package main

import "fmt"

func main() {
  fmt.Println("Hello! Welcome to Info Oasis.")
  numbers := []int{1, 2, 3, 4, 5}
  sum := 0
  for _, number := range numbers { sum += number }
  fmt.Println("Sum:", sum)
}`, `// Բարի գալուստ Info Oasis-ի Go փորձադաշտ 🚀
package main

import "fmt"

func main() {
  fmt.Println("Ողջույն։ Բարի գալուստ Info Oasis։")
  numbers := []int{1, 2, 3, 4, 5}
  sum := 0
  for _, number := range numbers { sum += number }
  fmt.Println("Գումար՝", sum)
}`)

const RUST_STARTER = localized(`// Добро пожаловать в песочницу Rust Info Oasis 🚀
fn main() {
    println!("Привет! Добро пожаловать в Info Oasis.");
    let numbers = [1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Сумма: {sum}");
}`, `// Welcome to the Info Oasis Rust playground 🚀
fn main() {
    println!("Hello! Welcome to Info Oasis.");
    let numbers = [1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {sum}");
}`, `// Բարի գալուստ Info Oasis-ի Rust փորձադաշտ 🚀
fn main() {
    println!("Ողջույն։ Բարի գալուստ Info Oasis։");
    let numbers = [1, 2, 3, 4, 5];
    let sum: i32 = numbers.iter().sum();
    println!("Գումար՝ {sum}");
}`)

const STARTERS: Record<PlaygroundLanguage, LocalizedText> = {
  javascript: JAVASCRIPT_STARTER,
  typescript: TYPESCRIPT_STARTER,
  python: PYTHON_STARTER,
  html: HTML_STARTER,
  java: JAVA_STARTER,
  cpp: CPP_STARTER,
  csharp: CSHARP_STARTER,
  go: GO_STARTER,
  rust: RUST_STARTER,
}

const CHALLENGES: Challenge[] = [
  {
    id: 'fizzbuzz',
    title: localized('FizzBuzz', 'FizzBuzz', 'FizzBuzz'),
    desc: localized('Выведи числа 1-20, заменяя кратные 3 на Fizz, 5 на Buzz, 15 на FizzBuzz', 'Print 1–20, replacing multiples of 3 with Fizz, 5 with Buzz, and 15 with FizzBuzz', 'Տպիր 1–20 թվերը՝ 3-ի բազմապատիկները փոխարինելով Fizz-ով, 5-ինը՝ Buzz-ով, իսկ 15-ինը՝ FizzBuzz-ով'),
    code: localized(`// FizzBuzz: числа от 1 до 20
for (let i = 1; i <= 20; i++) {
  let out = ''
  if (i % 3 === 0) out += 'Fizz'
  if (i % 5 === 0) out += 'Buzz'
  console.log(out || i)
}`, `// FizzBuzz: numbers from 1 to 20
for (let i = 1; i <= 20; i++) {
  let out = ''
  if (i % 3 === 0) out += 'Fizz'
  if (i % 5 === 0) out += 'Buzz'
  console.log(out || i)
}`, `// FizzBuzz․ 1-ից 20 թվերը
for (let i = 1; i <= 20; i++) {
  let out = ''
  if (i % 3 === 0) out += 'Fizz'
  if (i % 5 === 0) out += 'Buzz'
  console.log(out || i)
}`),
    hint: localized('Используй оператор % (остаток от деления) и конкатенацию строк.', 'Use the % remainder operator and string concatenation.', 'Օգտագործիր % մնացորդի օպերատորը և տողերի միացումը։'),
  },
  {
    id: 'fib',
    title: localized('Числа Фибоначчи', 'Fibonacci numbers', 'Ֆիբոնաչիի թվեր'),
    desc: localized('Выведи первые 10 чисел последовательности Фибоначчи', 'Print the first ten Fibonacci numbers', 'Տպիր Ֆիբոնաչիի հաջորդականության առաջին տասը թվերը'),
    code: localized(`// Первые 10 чисел Фибоначчи
let a = 0, b = 1
const fib = [a, b]
for (let i = 2; i < 10; i++) {
  const next = a + b
  fib.push(next)
  a = b
  b = next
}
console.log('Фибоначчи:', fib.join(', '))`, `// First ten Fibonacci numbers
let a = 0, b = 1
const fib = [a, b]
for (let i = 2; i < 10; i++) {
  const next = a + b
  fib.push(next)
  a = b
  b = next
}
console.log('Fibonacci:', fib.join(', '))`, `// Ֆիբոնաչիի առաջին տասը թվերը
let a = 0, b = 1
const fib = [a, b]
for (let i = 2; i < 10; i++) {
  const next = a + b
  fib.push(next)
  a = b
  b = next
}
console.log('Ֆիբոնաչի՝', fib.join(', '))`),
    hint: localized('Каждое следующее число = сумма двух предыдущих.', 'Each number is the sum of the previous two.', 'Յուրաքանչյուր հաջորդ թիվը նախորդ երկուսի գումարն է։'),
  },
  {
    id: 'palindrome',
    title: localized('Палиндром', 'Palindrome', 'Պալինդրոմ'),
    desc: localized('Проверь, является ли строка палиндромом', 'Check whether a string is a palindrome', 'Ստուգիր՝ արդյոք տողը պալինդրոմ է'),
    code: localized(`// Проверка палиндрома
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  return clean === clean.split('').reverse().join('')
}

console.log(isPalindrome('А роза упала на лапу Азора')) // ?
console.log(isPalindrome('привет')) // ?`, `// Palindrome check
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  return clean === clean.split('').reverse().join('')
}

console.log(isPalindrome('Never odd or even')) // ?
console.log(isPalindrome('hello')) // ?`, `// Պալինդրոմի ստուգում
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  return clean === clean.split('').reverse().join('')
}

console.log(isPalindrome('Աննա')) // ?
console.log(isPalindrome('ողջույն')) // ?`),
    hint: localized('Очисти строку от пробелов и регистра, затем сравни с перевёрнутой.', 'Remove spaces and letter casing, then compare with the reversed string.', 'Հեռացրու բացատներն ու տառաչափի տարբերությունը, ապա համեմատիր շրջված տողի հետ։'),
  },
  {
    id: 'sort',
    title: localized('Сортировка объектов', 'Sorting objects', 'Օբյեկտների տեսակավորում'),
    desc: localized('Отсортируй пользователей по возрасту (по убыванию)', 'Sort users by age in descending order', 'Տեսակավորիր օգտատերերին ըստ տարիքի՝ նվազման կարգով'),
    code: localized(`// Сортировка массива объектов
const users = [
  { name: 'Аня', age: 28 },
  { name: 'Боря', age: 19 },
  { name: 'Вика', age: 35 },
  { name: 'Гена', age: 22 },
]

const sorted = [...users].sort((a, b) => b.age - a.age)
console.log('По возрасту (убыв.):')
sorted.forEach((u, i) => console.log(\`\${i + 1}. \${u.name}, \${u.age} лет\`))
// ↑ попробуй попросить AI-подсказку для разбора!`, `// Sorting an array of objects
const users = [
  { name: 'Anna', age: 28 },
  { name: 'Ben', age: 19 },
  { name: 'Victoria', age: 35 },
  { name: 'George', age: 22 },
]

const sorted = [...users].sort((a, b) => b.age - a.age)
console.log('By age (descending):')
sorted.forEach((u, i) => console.log(\`\${i + 1}. \${u.name}, age \${u.age}\`))
// ↑ Ask for an AI hint to understand how this works!`, `// Օբյեկտների զանգվածի տեսակավորում
const users = [
  { name: 'Անի', age: 28 },
  { name: 'Բեն', age: 19 },
  { name: 'Վիկա', age: 35 },
  { name: 'Գևորգ', age: 22 },
]

const sorted = [...users].sort((a, b) => b.age - a.age)
console.log('Ըստ տարիքի՝ նվազման կարգով․')
sorted.forEach((u, i) => console.log(\`\${i + 1}. \${u.name}, \${u.age} տարեկան\`))
// ↑ Խնդրիր AI հուշում՝ հասկանալու համար, թե ինչպես է սա աշխատում։`),
    hint: localized('Передай компаратор в sort(): (a, b) => b.age - a.age для убывания. Сделай копию через [...users], чтобы не менять оригинал.', 'Pass (a, b) => b.age - a.age to sort(). Copy with [...users] so the original is unchanged.', 'sort()-ին փոխանցիր (a, b) => b.age - a.age համեմատիչը։ [...users]-ով պատճեն ստեղծիր, որպեսզի բնօրինակը չփոխվի։'),
  },
]

const sharedCode = (code: string): LocalizedText => ({ ru: code, en: code, hy: code })

const ALGORITHM_CHALLENGE_CODE: Record<
  Exclude<PlaygroundLanguage, 'javascript' | 'html'>,
  Record<ChallengeId, string>
> = {
  typescript: {
    fizzbuzz: `const values: Array<string | number> = []
for (let i = 1; i <= 20; i++) {
  let value = ''
  if (i % 3 === 0) value += 'Fizz'
  if (i % 5 === 0) value += 'Buzz'
  values.push(value || i)
}
console.log(values.join(', '))`,
    fib: `const fibonacci: number[] = [0, 1]
while (fibonacci.length < 10) {
  const last = fibonacci.at(-1) ?? 0
  const previous = fibonacci.at(-2) ?? 0
  fibonacci.push(last + previous)
}
console.log(fibonacci.join(', '))`,
    palindrome: `function isPalindrome(value: string): boolean {
  const clean = value.toLowerCase().replace(/[^\\p{L}\\p{N}]/gu, '')
  return clean === [...clean].reverse().join('')
}

console.log(isPalindrome('Never odd or even'))
console.log(isPalindrome('Info Oasis'))`,
    sort: `interface User {
  name: string
  age: number
}

const users: User[] = [
  { name: 'Anna', age: 28 },
  { name: 'Ben', age: 19 },
  { name: 'Victoria', age: 35 },
]

const sorted = [...users].sort((a, b) => b.age - a.age)
sorted.forEach((user) => console.log(user.name, user.age))`,
  },
  python: {
    fizzbuzz: `values = []
for number in range(1, 21):
    value = ""
    if number % 3 == 0:
        value += "Fizz"
    if number % 5 == 0:
        value += "Buzz"
    values.append(value or str(number))

print(", ".join(values))`,
    fib: `fibonacci = [0, 1]
while len(fibonacci) < 10:
    fibonacci.append(fibonacci[-1] + fibonacci[-2])

print(*fibonacci, sep=", ")`,
    palindrome: `def is_palindrome(value: str) -> bool:
    clean = "".join(char.lower() for char in value if char.isalnum())
    return clean == clean[::-1]

print(is_palindrome("Never odd or even"))
print(is_palindrome("Info Oasis"))`,
    sort: `users = [
    {"name": "Anna", "age": 28},
    {"name": "Ben", "age": 19},
    {"name": "Victoria", "age": 35},
]

for user in sorted(users, key=lambda item: item["age"], reverse=True):
    print(user["name"], user["age"])`,
  },
  java: {
    fizzbuzz: `class Main {
  public static void main(String[] args) {
    for (int number = 1; number <= 20; number++) {
      String value = "";
      if (number % 3 == 0) value += "Fizz";
      if (number % 5 == 0) value += "Buzz";
      System.out.println(value.isEmpty() ? number : value);
    }
  }
}`,
    fib: `import java.util.ArrayList;
import java.util.List;

class Main {
  public static void main(String[] args) {
    List<Integer> fibonacci = new ArrayList<>(List.of(0, 1));
    while (fibonacci.size() < 10) {
      int size = fibonacci.size();
      fibonacci.add(fibonacci.get(size - 1) + fibonacci.get(size - 2));
    }
    System.out.println(fibonacci);
  }
}`,
    palindrome: `class Main {
  static boolean isPalindrome(String value) {
    String clean = value.toLowerCase().replaceAll("[^\\p{L}\\p{N}]", "");
    return clean.contentEquals(new StringBuilder(clean).reverse());
  }

  public static void main(String[] args) {
    System.out.println(isPalindrome("Never odd or even"));
    System.out.println(isPalindrome("Info Oasis"));
  }
}`,
    sort: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

class Main {
  static class User {
    final String name;
    final int age;
    User(String name, int age) { this.name = name; this.age = age; }
  }

  public static void main(String[] args) {
    List<User> users = new ArrayList<>(List.of(
      new User("Anna", 28), new User("Ben", 19), new User("Victoria", 35)
    ));
    users.sort(Comparator.comparingInt((User user) -> user.age).reversed());
    users.forEach(user -> System.out.println(user.name + " " + user.age));
  }
}`,
  },
  cpp: {
    fizzbuzz: `#include <iostream>
#include <string>

int main() {
  for (int number = 1; number <= 20; ++number) {
    std::string value;
    if (number % 3 == 0) value += "Fizz";
    if (number % 5 == 0) value += "Buzz";
    std::cout << (value.empty() ? std::to_string(number) : value) << '\\n';
  }
}`,
    fib: `#include <iostream>
#include <vector>

int main() {
  std::vector<long long> fibonacci{0, 1};
  while (fibonacci.size() < 10) {
    fibonacci.push_back(fibonacci[fibonacci.size() - 1] + fibonacci[fibonacci.size() - 2]);
  }
  for (long long value : fibonacci) std::cout << value << ' ';
  std::cout << '\\n';
}`,
    palindrome: `#include <algorithm>
#include <cctype>
#include <iostream>
#include <string>

bool isPalindrome(const std::string& value) {
  std::string clean;
  for (unsigned char character : value) {
    if (std::isalnum(character)) clean += static_cast<char>(std::tolower(character));
  }
  return std::equal(clean.begin(), clean.begin() + clean.size() / 2, clean.rbegin());
}

int main() {
  std::cout << std::boolalpha << isPalindrome("Never odd or even") << '\\n';
  std::cout << isPalindrome("Info Oasis") << '\\n';
}`,
    sort: `#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct User { std::string name; int age; };

int main() {
  std::vector<User> users{{"Anna", 28}, {"Ben", 19}, {"Victoria", 35}};
  std::sort(users.begin(), users.end(), [](const User& a, const User& b) {
    return a.age > b.age;
  });
  for (const auto& user : users) std::cout << user.name << ' ' << user.age << '\\n';
}`,
  },
  csharp: {
    fizzbuzz: `using System;

public class Program {
  public static void Main() {
    for (int number = 1; number <= 20; number++) {
      string value = "";
      if (number % 3 == 0) value += "Fizz";
      if (number % 5 == 0) value += "Buzz";
      Console.WriteLine(value.Length == 0 ? number.ToString() : value);
    }
  }
}`,
    fib: `using System;
using System.Collections.Generic;

public class Program {
  public static void Main() {
    var fibonacci = new List<int> { 0, 1 };
    while (fibonacci.Count < 10) {
      fibonacci.Add(fibonacci[^1] + fibonacci[^2]);
    }
    Console.WriteLine(string.Join(", ", fibonacci));
  }
}`,
    palindrome: `using System;
using System.Linq;

public class Program {
  static bool IsPalindrome(string value) {
    string clean = string.Concat(value.Where(char.IsLetterOrDigit)).ToLowerInvariant();
    return clean.SequenceEqual(clean.Reverse());
  }

  public static void Main() {
    Console.WriteLine(IsPalindrome("Never odd or even"));
    Console.WriteLine(IsPalindrome("Info Oasis"));
  }
}`,
    sort: `using System;
using System.Linq;

public class Program {
  record User(string Name, int Age);

  public static void Main() {
    var users = new[] { new User("Anna", 28), new User("Ben", 19), new User("Victoria", 35) };
    foreach (var user in users.OrderByDescending(user => user.Age)) {
      Console.WriteLine($"{user.Name} {user.Age}");
    }
  }
}`,
  },
  go: {
    fizzbuzz: `package main

import "fmt"

func main() {
  for number := 1; number <= 20; number++ {
    value := ""
    if number%3 == 0 { value += "Fizz" }
    if number%5 == 0 { value += "Buzz" }
    if value == "" { fmt.Println(number) } else { fmt.Println(value) }
  }
}`,
    fib: `package main

import "fmt"

func main() {
  fibonacci := []int{0, 1}
  for len(fibonacci) < 10 {
    size := len(fibonacci)
    fibonacci = append(fibonacci, fibonacci[size-1]+fibonacci[size-2])
  }
  fmt.Println(fibonacci)
}`,
    palindrome: `package main

import (
  "fmt"
  "unicode"
)

func isPalindrome(value string) bool {
  clean := []rune{}
  for _, character := range []rune(value) {
    if unicode.IsLetter(character) || unicode.IsDigit(character) {
      clean = append(clean, unicode.ToLower(character))
    }
  }
  for left, right := 0, len(clean)-1; left < right; left, right = left+1, right-1 {
    if clean[left] != clean[right] { return false }
  }
  return true
}

func main() {
  fmt.Println(isPalindrome("Never odd or even"))
  fmt.Println(isPalindrome("Info Oasis"))
}`,
    sort: `package main

import (
  "fmt"
  "sort"
)

type User struct { Name string; Age int }

func main() {
  users := []User{{"Anna", 28}, {"Ben", 19}, {"Victoria", 35}}
  sort.Slice(users, func(i, j int) bool { return users[i].Age > users[j].Age })
  for _, user := range users { fmt.Println(user.Name, user.Age) }
}`,
  },
  rust: {
    fizzbuzz: `fn main() {
    for number in 1..=20 {
        let mut value = String::new();
        if number % 3 == 0 { value.push_str("Fizz"); }
        if number % 5 == 0 { value.push_str("Buzz"); }
        if value.is_empty() { println!("{number}"); } else { println!("{value}"); }
    }
}`,
    fib: `fn main() {
    let mut fibonacci = vec![0_i64, 1];
    while fibonacci.len() < 10 {
        let size = fibonacci.len();
        fibonacci.push(fibonacci[size - 1] + fibonacci[size - 2]);
    }
    println!("{:?}", fibonacci);
}`,
    palindrome: `fn is_palindrome(value: &str) -> bool {
    let clean: Vec<char> = value
        .chars()
        .filter(|character| character.is_alphanumeric())
        .flat_map(char::to_lowercase)
        .collect();
    clean.iter().eq(clean.iter().rev())
}

fn main() {
    println!("{}", is_palindrome("Never odd or even"));
    println!("{}", is_palindrome("Info Oasis"));
}`,
    sort: `#[derive(Debug)]
struct User { name: &'static str, age: u8 }

fn main() {
    let mut users = vec![
        User { name: "Anna", age: 28 },
        User { name: "Ben", age: 19 },
        User { name: "Victoria", age: 35 },
    ];
    users.sort_by(|a, b| b.age.cmp(&a.age));
    for user in users { println!("{} {}", user.name, user.age); }
}`,
  },
}

const htmlDocument = (lang: 'ru' | 'en' | 'hy', body: string, css: string) => `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; padding: 32px; font-family: system-ui; background: #12091d; color: white; }
    ${css}
  </style>
</head>
<body>${body}</body>
</html>`

const HTML_CHALLENGES: Challenge[] = [
  {
    id: 'fizzbuzz',
    title: localized('Карточка профиля', 'Profile card', 'Պրոֆիլի քարտ'),
    desc: localized('Создай аккуратную карточку с аватаром, именем и описанием', 'Build a polished card with an avatar, name, and description', 'Ստեղծիր կոկիկ քարտ՝ ավատարով, անունով և նկարագրությամբ'),
    hint: localized('Используй flex, gap, border-radius и мягкую тень.', 'Use flex, gap, border-radius, and a soft shadow.', 'Օգտագործիր flex, gap, border-radius և մեղմ ստվեր։'),
    code: localized(
      htmlDocument('ru', '<article class="profile"><div class="avatar">S</div><div><h1>Ученик Info Oasis</h1><p>Изучаю веб-разработку шаг за шагом.</p></div></article>', '.profile { max-width: 520px; display: flex; gap: 20px; align-items: center; padding: 28px; border: 1px solid #6d3a86; border-radius: 24px; background: #241331; box-shadow: 0 24px 60px #0008; } .avatar { display: grid; place-items: center; width: 72px; aspect-ratio: 1; border-radius: 20px; background: linear-gradient(135deg, #8b5cf6, #ec4899); font-size: 28px; font-weight: 800; } h1 { margin: 0 0 8px; } p { margin: 0; color: #c8b9d3; }'),
      htmlDocument('en', '<article class="profile"><div class="avatar">S</div><div><h1>Info Oasis learner</h1><p>Learning web development one step at a time.</p></div></article>', '.profile { max-width: 520px; display: flex; gap: 20px; align-items: center; padding: 28px; border: 1px solid #6d3a86; border-radius: 24px; background: #241331; box-shadow: 0 24px 60px #0008; } .avatar { display: grid; place-items: center; width: 72px; aspect-ratio: 1; border-radius: 20px; background: linear-gradient(135deg, #8b5cf6, #ec4899); font-size: 28px; font-weight: 800; } h1 { margin: 0 0 8px; } p { margin: 0; color: #c8b9d3; }'),
      htmlDocument('hy', '<article class="profile"><div class="avatar">S</div><div><h1>Info Oasis-ի սովորող</h1><p>Քայլ առ քայլ սովորում եմ վեբ մշակում։</p></div></article>', '.profile { max-width: 520px; display: flex; gap: 20px; align-items: center; padding: 28px; border: 1px solid #6d3a86; border-radius: 24px; background: #241331; box-shadow: 0 24px 60px #0008; } .avatar { display: grid; place-items: center; width: 72px; aspect-ratio: 1; border-radius: 20px; background: linear-gradient(135deg, #8b5cf6, #ec4899); font-size: 28px; font-weight: 800; } h1 { margin: 0 0 8px; } p { margin: 0; color: #c8b9d3; }')
    ),
  },
  {
    id: 'fib',
    title: localized('Адаптивная сетка', 'Responsive grid', 'Հարմարվող ցանց'),
    desc: localized('Собери сетку, которая меняет число колонок на узком экране', 'Create a grid that changes columns on smaller screens', 'Ստեղծիր ցանց, որը փոքր էկրանին փոխում է սյունակների քանակը'),
    hint: localized('Используй CSS Grid, minmax() и auto-fit.', 'Use CSS Grid, minmax(), and auto-fit.', 'Օգտագործիր CSS Grid, minmax() և auto-fit։'),
    code: localized(
      htmlDocument('ru', '<main><h1>Темы для изучения</h1><section class="grid"><article>HTML</article><article>CSS</article><article>JavaScript</article><article>Доступность</article></section></main>', 'main { max-width: 900px; margin: auto; } .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; } article { min-height: 140px; display: grid; place-items: center; border: 1px solid #644077; border-radius: 20px; background: linear-gradient(145deg, #281438, #172637); font-weight: 700; }'),
      htmlDocument('en', '<main><h1>Topics to learn</h1><section class="grid"><article>HTML</article><article>CSS</article><article>JavaScript</article><article>Accessibility</article></section></main>', 'main { max-width: 900px; margin: auto; } .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; } article { min-height: 140px; display: grid; place-items: center; border: 1px solid #644077; border-radius: 20px; background: linear-gradient(145deg, #281438, #172637); font-weight: 700; }'),
      htmlDocument('hy', '<main><h1>Սովորելու թեմաներ</h1><section class="grid"><article>HTML</article><article>CSS</article><article>JavaScript</article><article>Մատչելիություն</article></section></main>', 'main { max-width: 900px; margin: auto; } .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; } article { min-height: 140px; display: grid; place-items: center; border: 1px solid #644077; border-radius: 20px; background: linear-gradient(145deg, #281438, #172637); font-weight: 700; }')
    ),
  },
  {
    id: 'palindrome',
    title: localized('Интерактивная кнопка', 'Interactive button', 'Ինտերակտիվ կոճակ'),
    desc: localized('Добавь плавные состояния hover, focus и active', 'Add smooth hover, focus, and active states', 'Ավելացրու սահուն hover, focus և active վիճակներ'),
    hint: localized('Не забудь :focus-visible для клавиатурной навигации.', 'Remember :focus-visible for keyboard navigation.', 'Մի մոռացիր :focus-visible-ը՝ ստեղնաշարային նավարկման համար։'),
    code: localized(
      htmlDocument('ru', '<button>Начать обучение <span>→</span></button>', 'body { display: grid; place-items: center; } button { border: 0; border-radius: 16px; padding: 16px 24px; color: white; background: linear-gradient(135deg, #7c3aed, #ec4899); font: 700 18px system-ui; cursor: pointer; box-shadow: 0 12px 32px #a855f766; transition: transform .2s, box-shadow .2s; } button:hover { transform: translateY(-3px); box-shadow: 0 18px 42px #ec489977; } button:active { transform: translateY(0); } button:focus-visible { outline: 3px solid #67e8f9; outline-offset: 5px; } span { margin-left: 8px; }'),
      htmlDocument('en', '<button>Start learning <span>→</span></button>', 'body { display: grid; place-items: center; } button { border: 0; border-radius: 16px; padding: 16px 24px; color: white; background: linear-gradient(135deg, #7c3aed, #ec4899); font: 700 18px system-ui; cursor: pointer; box-shadow: 0 12px 32px #a855f766; transition: transform .2s, box-shadow .2s; } button:hover { transform: translateY(-3px); box-shadow: 0 18px 42px #ec489977; } button:active { transform: translateY(0); } button:focus-visible { outline: 3px solid #67e8f9; outline-offset: 5px; } span { margin-left: 8px; }'),
      htmlDocument('hy', '<button>Սկսել ուսուցումը <span>→</span></button>', 'body { display: grid; place-items: center; } button { border: 0; border-radius: 16px; padding: 16px 24px; color: white; background: linear-gradient(135deg, #7c3aed, #ec4899); font: 700 18px system-ui; cursor: pointer; box-shadow: 0 12px 32px #a855f766; transition: transform .2s, box-shadow .2s; } button:hover { transform: translateY(-3px); box-shadow: 0 18px 42px #ec489977; } button:active { transform: translateY(0); } button:focus-visible { outline: 3px solid #67e8f9; outline-offset: 5px; } span { margin-left: 8px; }')
    ),
  },
  {
    id: 'sort',
    title: localized('Форма входа', 'Sign-in form', 'Մուտքի ձև'),
    desc: localized('Оформи доступную форму с подписями и состояниями фокуса', 'Style an accessible form with labels and focus states', 'Ձևավորիր մատչելի ձև՝ պիտակներով և focus վիճակներով'),
    hint: localized('Свяжи label и input через атрибуты for и id.', 'Connect each label and input with for and id.', 'label-ն ու input-ը կապիր for և id հատկանիշներով։'),
    code: localized(
      htmlDocument('ru', '<form><h1>С возвращением</h1><label for="email">Эл. почта</label><input id="email" type="email" placeholder="you@example.com"><label for="password">Пароль</label><input id="password" type="password"><button>Войти</button></form>', 'form { width: min(100%, 420px); margin: auto; display: grid; gap: 12px; padding: 28px; border: 1px solid #624174; border-radius: 24px; background: #21122d; } h1 { margin: 0 0 10px; } label { font-size: 14px; color: #d8c5e2; } input { width: 100%; padding: 14px; border: 1px solid #624174; border-radius: 12px; background: #130b1b; color: white; outline: none; } input:focus { border-color: #d946ef; box-shadow: 0 0 0 4px #d946ef22; } button { margin-top: 8px; padding: 14px; border: 0; border-radius: 12px; background: #a855f7; color: white; font-weight: 700; }'),
      htmlDocument('en', '<form><h1>Welcome back</h1><label for="email">Email</label><input id="email" type="email" placeholder="you@example.com"><label for="password">Password</label><input id="password" type="password"><button>Sign in</button></form>', 'form { width: min(100%, 420px); margin: auto; display: grid; gap: 12px; padding: 28px; border: 1px solid #624174; border-radius: 24px; background: #21122d; } h1 { margin: 0 0 10px; } label { font-size: 14px; color: #d8c5e2; } input { width: 100%; padding: 14px; border: 1px solid #624174; border-radius: 12px; background: #130b1b; color: white; outline: none; } input:focus { border-color: #d946ef; box-shadow: 0 0 0 4px #d946ef22; } button { margin-top: 8px; padding: 14px; border: 0; border-radius: 12px; background: #a855f7; color: white; font-weight: 700; }'),
      htmlDocument('hy', '<form><h1>Բարի վերադարձ</h1><label for="email">Էլ․ հասցե</label><input id="email" type="email" placeholder="you@example.com"><label for="password">Գաղտնաբառ</label><input id="password" type="password"><button>Մուտք գործել</button></form>', 'form { width: min(100%, 420px); margin: auto; display: grid; gap: 12px; padding: 28px; border: 1px solid #624174; border-radius: 24px; background: #21122d; } h1 { margin: 0 0 10px; } label { font-size: 14px; color: #d8c5e2; } input { width: 100%; padding: 14px; border: 1px solid #624174; border-radius: 12px; background: #130b1b; color: white; outline: none; } input:focus { border-color: #d946ef; box-shadow: 0 0 0 4px #d946ef22; } button { margin-top: 8px; padding: 14px; border: 0; border-radius: 12px; background: #a855f7; color: white; font-weight: 700; }')
    ),
  },
]

function getChallenges(language: PlaygroundLanguage): Challenge[] {
  if (language === 'javascript') return CHALLENGES
  if (language === 'html') return HTML_CHALLENGES

  return CHALLENGES.map((challenge) => ({
    ...challenge,
    code: sharedCode(ALGORITHM_CHALLENGE_CODE[language][challenge.id]),
  }))
}

const isChallengeTemplate = (code: string) =>
  (Object.keys(LANGUAGE_DETAILS) as PlaygroundLanguage[]).some((language) =>
    getChallenges(language).some((challenge) => Object.values(challenge.code).includes(code))
  )

/** Build the sandboxed iframe srcdoc that runs code safely. */
function buildSandboxDoc(): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<script>
  // Capture console methods
  const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  function send(type, args) {
    try {
      parent.postMessage({ __info_oasis_sandbox: true, kind: 'log', log: { type, args: args.map(String) } }, '*');
    } catch (e) {}
  }
  console.log = (...a) => { send('log', a); orig.log(...a); };
  console.warn = (...a) => { send('warn', a); orig.warn(...a); };
  console.error = (...a) => { send('error', a); orig.error(...a); };
  console.info = (...a) => { send('info', a); orig.info(...a); };
  window.addEventListener('error', (e) => {
    parent.postMessage({ __info_oasis_sandbox: true, kind: 'error', message: e.message }, '*');
  });
  window.addEventListener('message', (e) => {
    if (!e.data || !e.data.__info_oasis_run) return;
    const code = e.data.code;
    let result = null;
    try {
      // Indirect eval → runs in global scope, captures return of expression
      result = eval(code);
      parent.postMessage({ __info_oasis_sandbox: true, kind: 'done', result: result === undefined ? null : String(result) }, '*');
    } catch (err) {
      parent.postMessage({ __info_oasis_sandbox: true, kind: 'error', message: (err && err.message) ? err.message : String(err) }, '*');
    }
  });
  parent.postMessage({ __info_oasis_sandbox: true, kind: 'ready' }, '*');
<\/script>
</body></html>`
}

export function PlaygroundView() {
  const { locale, tr, localize } = useTranslations()
  const [language, setLanguage] = useState<PlaygroundLanguage>('javascript')
  const [code, setCode] = useState(() => localize(STARTERS.javascript))
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [tab, setTab] = useState<'console' | 'hint'>('console')
  const [hint, setHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const readyRef = useRef(false)
  const previousLocaleRef = useRef(locale)

  // Keep untouched starter/exercise text aligned with the selected site language.
  useEffect(() => {
    const previousLocale = previousLocaleRef.current
    if (previousLocale === locale) return

    setCode((current) => {
      const challenge = getChallenges(language).find((item) => item.id === activeChallenge)
      const previousTemplate = challenge
        ? challenge.code[previousLocale]
        : STARTERS[language][previousLocale]
      const nextTemplate = challenge ? challenge.code[locale] : STARTERS[language][locale]
      return current === previousTemplate ? nextTemplate : current
    })
    setLogs([])
    setError(null)
    setResult(null)
    setPreviewDoc(null)
    setHint(null)
    previousLocaleRef.current = locale
  }, [activeChallenge, language, locale])

  // Create sandbox iframe once
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.srcdoc = buildSandboxDoc()
  }, [])

  // Listen for sandbox messages
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data
      if (!d || !d.__info_oasis_sandbox) return
      if (d.kind === 'ready') {
        readyRef.current = true
      } else if (d.kind === 'log') {
        setLogs((prev) => [...prev, d.log])
      } else if (d.kind === 'error') {
        setError(d.message)
        setRunning(false)
      } else if (d.kind === 'done') {
        setResult(d.result)
        setRunning(false)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const run = useCallback(async () => {
    setLogs([])
    setError(null)
    setResult(null)
    setPreviewDoc(null)
    setTab('console')
    setRunning(true)

    if (language === 'html') {
      setPreviewDoc(code)
      setRunning(false)
      return
    }

    if (!['javascript', 'typescript'].includes(language)) {
      try {
        const response = await fetch('/api/playground/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'Execution failed')
        if (data.output) setLogs([{ type: 'log', args: [data.output.trimEnd()] }])
        if (data.error) setError(data.error.trimEnd())
        if (!data.output && !data.error) {
          setResult(tr('Выполнено без вывода', 'Completed without output', 'Կատարված է առանց արտածման'))
        }
      } catch (executionError) {
        setError(executionError instanceof Error ? executionError.message : String(executionError))
      } finally {
        setRunning(false)
      }
      return
    }

    let executableCode = code
    if (language === 'typescript') {
      try {
        const response = await fetch('/api/playground/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error ?? 'TypeScript compilation failed')
        executableCode = data.code
      } catch (compileError) {
        setError(compileError instanceof Error ? compileError.message : String(compileError))
        setRunning(false)
        return
      }
    }
    // small delay in case iframe not ready
    const send = () => {
      if (!readyRef.current) {
        setTimeout(send, 80)
        return
      }
      iframeRef.current?.contentWindow?.postMessage({ __info_oasis_run: true, code: executableCode }, '*')
    }
    send()
    // safety timeout
    setTimeout(() => setRunning((r) => r), 5000)
  }, [code, language, tr])

  const clearOutput = useCallback(() => {
    setLogs([])
    setError(null)
    setResult(null)
    setPreviewDoc(null)
  }, [])

  const resetCode = useCallback(() => {
    setCode(localize(STARTERS[language]))
    setActiveChallenge(null)
    clearOutput()
    toast(tr('Код сброшен', 'Code reset', 'Կոդը վերականգնված է'), { icon: <RotateCcw className="h-4 w-4" /> })
  }, [clearOutput, language, localize, tr])

  const changeLanguage = useCallback((nextLanguage: PlaygroundLanguage) => {
    setCode((current) => {
      const isKnownTemplate = Object.values(STARTERS).some(
        (starter) => Object.values(starter).includes(current)
      ) || isChallengeTemplate(current)
      return isKnownTemplate ? STARTERS[nextLanguage][locale] : current
    })
    setLanguage(nextLanguage)
    setActiveChallenge(null)
    clearOutput()
  }, [clearOutput, locale])

  const askHint = useCallback(async () => {
    setHintLoading(true)
    setTab('hint')
    setHint(null)
    try {
      const challenge = getChallenges(language).find((c) => c.id === activeChallenge)
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          error,
          language,
          locale,
          task: challenge ? `${localize(challenge.title)}: ${localize(challenge.desc)}` : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHint(data.hint)
      toast.success(tr('AI-наставник ответил', 'AI tutor responded', 'AI ուսուցիչը պատասխանեց'), { icon: <Sparkles className="h-4 w-4" /> })
    } catch {
      toast.error(tr('Не удалось получить подсказку', 'Could not get a hint', 'Չհաջողվեց հուշում ստանալ'))
    } finally {
      setHintLoading(false)
    }
  }, [code, error, language, locale, activeChallenge, localize, tr])

  const loadChallenge = useCallback((c: Challenge) => {
    setCode(localize(c.code))
    setActiveChallenge(c.id)
    clearOutput()
    toast(`${tr('Загружено:', 'Loaded:', 'Բեռնված է՝')} ${localize(c.title)}`, { icon: <Code2 className="h-4 w-4" /> })
  }, [clearOutput, localize, tr])

  // Keyboard: Ctrl+Enter to run
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run])

  // Handle textarea scroll sync + tab key
  function onEditorScroll() {
    if (gutterRef.current && editorRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop
    }
  }
  function onEditorKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = code.slice(0, start) + '  ' + code.slice(end)
      setCode(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const lineCount = code.split('\n').length
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

  const hasOutput = logs.length > 0 || Boolean(error) || result !== null || previewDoc !== null
  const languageDetails = LANGUAGE_DETAILS[language]

  return (
    <PageSection>
      <SectionHeader
        title={tr('Песочница кода', 'Code playground', 'Կոդի փորձադաշտ')}
        subtitle={tr('Пиши код на девяти языках, запускай в песочнице и получай подсказки от AI', 'Write code in nine languages, run it in a sandbox, and get hints from AI', 'Գրիր կոդ ինը լեզվով, գործարկիր փորձադաշտում և ստացիր AI հուշումներ')}
        icon={Terminal}
        action={
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <Code2 className="h-3.5 w-3.5 text-emerald-400" />
            {languageDetails.label}
            <span className="mx-1 h-3 w-px bg-border" />
            <kbd className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px]">Ctrl+↵</kbd>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={language} onValueChange={(value) => changeLanguage(value as PlaygroundLanguage)}>
          <SelectTrigger className="w-full bg-card/60 sm:w-[140px]" aria-label={tr('Язык кода', 'Code language', 'Կոդի լեզու')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LANGUAGE_DETAILS).map(([value, details]) => (
              <SelectItem key={value} value={value}>{details.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={run}
          disabled={running}
          className="min-w-0 flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 sm:flex-none"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {tr('Запустить', 'Run', 'Գործարկել')}
        </Button>
        <Button className="min-w-0 flex-1 sm:flex-none" variant="outline" onClick={askHint} disabled={hintLoading}>
          {hintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4 text-amber-400" />}
          {tr('AI-подсказка', 'AI hint', 'AI հուշում')}
        </Button>
        <Button variant="ghost" onClick={clearOutput} disabled={!hasOutput}>
          <Trash2 className="h-4 w-4" />
          {tr('Очистить', 'Clear', 'Մաքրել')}
        </Button>
        <Button variant="ghost" onClick={resetCode}>
          <RotateCcw className="h-4 w-4" />
          {tr('Сброс', 'Reset', 'Վերականգնել')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(code)
            toast.success(tr('Код скопирован', 'Code copied', 'Կոդը պատճենված է'), { icon: <Copy className="h-4 w-4" /> })
          }}
        >
          <Copy className="h-4 w-4" />
          {tr('Копировать', 'Copy', 'Պատճենել')}
        </Button>
      </div>

      {/* Editor + Output grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Code editor */}
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/70" />
                <div className="h-3 w-3 rounded-full bg-amber-500/70" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
              </div>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {language === 'java' ? 'Main' : language === 'csharp' ? 'Program' : 'script'}.{languageDetails.extension}
              </span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{lineCount} {tr('строк', 'lines', 'տող')}</span>
          </div>
          <div className="relative flex h-[360px] sm:h-[460px]">
            {/* Line numbers gutter */}
            <div
              ref={gutterRef}
              className="select-none overflow-hidden border-r border-border/40 bg-muted/20 px-3 py-3 text-right font-mono text-sm leading-6 text-muted-foreground/60"
              style={{ minWidth: '3rem' }}
              aria-hidden
            >
              {lineNumbers.map((n) => (
                <div key={n} className="tabular-nums">
                  {n}
                </div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={onEditorScroll}
              onKeyDown={onEditorKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="min-w-0 flex-1 resize-none overflow-auto bg-transparent p-3 font-mono text-sm leading-6 text-foreground outline-none"
              placeholder={tr('// Пиши код здесь...', '// Write code here...', '// Գրիր կոդն այստեղ...')}
            />
          </div>
        </GlassCard>

        {/* Output panel */}
        <GlassCard className="overflow-hidden" hover={false}>
          {/* Tabs */}
          <div className="flex border-b border-border/60">
            <button
              onClick={() => setTab('console')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors',
                tab === 'console'
                  ? 'border-b-2 border-emerald-500 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              {language === 'html'
                ? tr('Предпросмотр', 'Preview', 'Նախադիտում')
                : tr('Консоль', 'Console', 'Վահանակ')}
              {logs.length > 0 && (
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                  {logs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('hint')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors',
                tab === 'hint'
                  ? 'border-b-2 border-amber-500 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              {tr('AI-наставник', 'AI tutor', 'AI ուսուցիչ')}
              {hint && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
            </button>
          </div>

          {/* Console content */}
          {tab === 'console' && (
            <div className="h-[360px] overflow-y-auto p-3 font-mono text-xs sm:h-[460px] sm:p-4">
              {language === 'html' && previewDoc && (
                <iframe
                  title={tr('Предпросмотр HTML', 'HTML preview', 'HTML նախադիտում')}
                  srcDoc={previewDoc}
                  sandbox="allow-scripts"
                  className="h-full w-full rounded-lg border border-border bg-white"
                />
              )}
              {running && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {tr('Выполняется...', 'Running...', 'Գործարկվում է...')}
                </div>
              )}
              {!hasOutput && !running && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <Terminal className="h-8 w-8 opacity-30" />
                  <p className="text-xs">{tr('Нажми «Запустить» — вывод появится здесь', 'Press “Run” and the output will appear here', 'Սեղմիր «Գործարկել», և արդյունքը կհայտնվի այստեղ')}</p>
                </div>
              )}
              <div className={cn('space-y-1', language === 'html' && 'hidden')}>
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'flex items-start gap-2 rounded px-2 py-1',
                      log.type === 'error' && 'bg-rose-500/10 text-rose-300',
                      log.type === 'warn' && 'bg-amber-500/10 text-amber-300',
                      log.type === 'info' && 'text-sky-300',
                      log.type === 'log' && 'text-foreground'
                    )}
                  >
                    <span className="select-none opacity-40">
                      {log.type === 'error' ? '✕' : log.type === 'warn' ? '⚠' : '›'}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{log.args.join(' ')}</span>
                  </motion.div>
                ))}
              </div>
              {error && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">{tr('Ошибка выполнения', 'Runtime error', 'Կատարման սխալ')}</p>
                    <p className="mt-0.5 break-all text-rose-200/80">{error}</p>
                  </div>
                </div>
              )}
              {result !== null && !error && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="break-all">{tr('Результат:', 'Result:', 'Արդյունք։')} {result}</span>
                </div>
              )}
            </div>
          )}

          {/* AI hint content */}
          {tab === 'hint' && (
            <div className="h-[360px] overflow-y-auto p-3 sm:h-[460px] sm:p-4">
              {hintLoading && (
                <div className="space-y-2">
                  {[100, 92, 96, 80, 88, 70, 94, 60].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 animate-pulse rounded bg-muted"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              )}
              {!hintLoading && !hint && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                    <Lightbulb className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-medium">{tr('AI-наставник по коду', 'AI coding tutor', 'AI ծրագրավորման ուսուցիչ')}</p>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                      {tr('Нажми «AI-подсказка» — наставник разберёт твой код, объяснит ошибки и подскажет, как улучшить.', 'Press “AI hint” and the tutor will review your code, explain errors, and suggest improvements.', 'Սեղմիր «AI հուշում», և ուսուցիչը կվերլուծի կոդդ, կբացատրի սխալները ու կառաջարկի բարելավումներ։')}
                    </p>
                  </div>
                </div>
              )}
              {!hintLoading && hint && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose-ai"
                >
                  <ReactMarkdown>{hint}</ReactMarkdown>
                </motion.div>
              )}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Challenges */}
      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{tr('Упражнения для разминки', 'Warm-up exercises', 'Նախավարժանքներ')}</h3>
          <span className="w-full text-xs text-muted-foreground sm:w-auto">{tr('Кликни, чтобы загрузить', 'Click to load', 'Սեղմիր՝ բեռնելու համար')}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {getChallenges(language).map((c) => {
            const isActive = activeChallenge === c.id
            return (
              <button
                key={c.id}
                onClick={() => loadChallenge(c)}
                className={cn(
                  'ambient-card group relative overflow-hidden rounded-xl border p-4 text-left transition-all',
                  isActive
                    ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/70'
                )}
              >
                {isActive && (
                  <div className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    ✓
                  </div>
                )}
                <p className="text-sm font-semibold">{localize(c.title)}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{localize(c.desc)}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Hidden sandbox iframe */}
      <iframe
        ref={iframeRef}
        title="sandbox"
        sandbox="allow-scripts"
        className="pointer-events-none fixed h-0 w-0 opacity-0"
        aria-hidden
      />
    </PageSection>
  )
}
