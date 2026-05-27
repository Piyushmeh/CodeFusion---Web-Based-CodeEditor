const templates = {
  Python: [
    {
      name: 'main.py',
      path: 'main.py',
      language: 'python',
      content: `# ${'{title}'}
def main():
    print("Hello from CodeFusion!")

if __name__ == "__main__":
    main()
`,
    },
  ],
  Java: [
    {
      name: 'Main.java',
      path: 'Main.java',
      language: 'java',
      content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from CodeFusion!");
    }
}
`,
    },
  ],
  'C++': [
    {
      name: 'main.cpp',
      path: 'main.cpp',
      language: 'cpp',
      content: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from CodeFusion!" << endl;
    return 0;
}
`,
    },
  ],
  HTML: [
    {
      name: 'index.html',
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello from CodeFusion!</h1>
  <script src="script.js"></script>
</body>
</html>
`,
    },
    {
      name: 'style.css',
      path: 'style.css',
      language: 'css',
      content: `body {
  font-family: system-ui, sans-serif;
  background: #0b0b0f;
  color: #fff;
  margin: 0;
  padding: 2rem;
}
`,
    },
    {
      name: 'script.js',
      path: 'script.js',
      language: 'javascript',
      content: `console.log("Hello from CodeFusion!");
`,
    },
  ],
  CSS: [
    {
      name: 'index.html',
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello from CodeFusion!</h1>
</body>
</html>
`,
    },
    {
      name: 'style.css',
      path: 'style.css',
      language: 'css',
      content: `body {
  font-family: system-ui, sans-serif;
  background: #0b0b0f;
  color: #fff;
}
`,
    },
  ],
  JavaScript: [
    {
      name: 'index.html',
      path: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Hello from CodeFusion!</h1>
  <script src="script.js"></script>
</body>
</html>
`,
    },
    {
      name: 'style.css',
      path: 'style.css',
      language: 'css',
      content: `body { font-family: system-ui; background: #0b0b0f; color: #fff; }
`,
    },
    {
      name: 'script.js',
      path: 'script.js',
      language: 'javascript',
      content: `console.log("Hello from CodeFusion!");
`,
    },
  ],
};

export const getBoilerplateFiles = (language, title = 'Project') => {
  const files = templates[language] || templates.JavaScript;
  return files.map((f) => ({
    ...f,
    content: f.content.replace(/\{title\}/g, title),
  }));
};
