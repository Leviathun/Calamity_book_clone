const fs = require('fs');
const path = require('path');
const dir = 'views/user';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ejs'));
files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    content = content.replace(/[\s\S]*?<body[^>]*>/i, '');
    content = content.replace(/<\/body>[\s\S]*/i, '');
    
    content = content.replace(/<%- include\(['"]\.\.\/templates\/nav-bar-user['"]\) %>\s*/g, '');
    
    if (file === 'home.ejs') {
        content = content.replace(/<%- include\(['"]\.\.\/templates\/nav-bar-user-home['"]\) %>\s*/g, "<%- include('../templates/nav-bot') %>\n");
    } else {
        content = content.replace(/<%- include\(['"]\.\.\/templates\/nav-bar-user-home['"]\) %>\s*/g, '');
    }
    
    content = content.replace(/<%- include\(['"]\.\.\/templates\/user-footer['"]\) %>\s*/g, '');
    
    content = content.replace(/<script src=["']\/?js\/home\.js["']><\/script>/gi, '');
    content = content.replace(/<script[^>]*bootstrap\.min\.js[^>]*><\/script>/gi, '');
    content = content.replace(/<script[^>]*popper\.min\.js[^>]*><\/script>/gi, '');
    content = content.replace(/<script[^>]*fontawesome[^>]*><\/script>/gi, '');

    fs.writeFileSync(filePath, content.trim() + '\n');
});
console.log('Boilerplate stripped from user views.');
