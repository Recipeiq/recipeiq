f = open('src/RecipeConfidenceEngine.jsx', encoding='utf-8')
content = f.read()
f.close()

old = '      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />\n    </div>'
new = '      </div>\n      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />\n    </div>'

if old in content:
    content = content.replace(old, new, 1)
    f = open('src/RecipeConfidenceEngine.jsx', 'w', encoding='utf-8')
    f.write(content)
    f.close()
    opens = content.count('<div')
    closes = content.count('</div>')
    print(f'Fixed! open:{opens} close:{closes} balanced:{opens==closes}')
else:
    print('Pattern not found')
    lines = content.split('\n')
    for i, line in enumerate(lines[-15:], len(lines)-15):
        print(i+1, repr(line))
