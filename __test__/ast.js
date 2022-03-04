module.exports = {
  type: 'Program',
  start: 0,
  end: 112,
  body: [
    {
      type: 'ImportDeclaration',
      start: 0,
      end: 35,
      specifiers: [
        {
          type: 'ImportSpecifier',
          start: 9,
          end: 12,
          imported: {
            type: 'Identifier',
            start: 9,
            end: 12,
            name: 'foo'
          },
          local: {
            type: 'Identifier',
            start: 9,
            end: 12,
            name: 'foo'
          }
        },
        {
          type: 'ImportSpecifier',
          start: 14,
          end: 19,
          imported: {
            type: 'Identifier',
            start: 14,
            end: 19,
            name: 'title'
          },
          local: {
            type: 'Identifier',
            start: 14,
            end: 19,
            name: 'title'
          }
        }
      ],
      source: {
        type: 'Literal',
        start: 27,
        end: 34,
        value: './foo',
        raw: "'./foo'"
      }
    },
    {
      type: 'ExpressionStatement',
      start: 37,
      end: 43,
      expression: {
        type: 'CallExpression',
        start: 37,
        end: 42,
        callee: {
          type: 'Identifier',
          start: 37,
          end: 40,
          name: 'foo'
        },
        arguments: []
      }
    },
    {
      type: 'FunctionDeclaration',
      start: 45,
      end: 94,
      id: {
        type: 'Identifier',
        start: 54,
        end: 66,
        name: 'saySomething'
      },
      expression: false,
      generator: false,
      params: [],
      body: {
        type: 'BlockStatement',
        start: 69,
        end: 94,
        body: [
          {
            type: 'ExpressionStatement',
            start: 73,
            end: 92,
            expression: {
              type: 'CallExpression',
              start: 73,
              end: 91,
              callee: {
                type: 'MemberExpression',
                start: 73,
                end: 84,
                object: {
                  type: 'Identifier',
                  start: 73,
                  end: 80,
                  name: 'console'
                },
                property: {
                  type: 'Identifier',
                  start: 81,
                  end: 84,
                  name: 'log'
                },
                computed: false
              },
              arguments: [
                {
                  type: 'Identifier',
                  start: 85,
                  end: 90,
                  name: 'title'
                }
              ]
            }
          }
        ]
      },
      _scope: {
        parent: {
          parent: null,
          depth: 0,
          names: ['saySomething', 'saySomething'],
          isBlockScope: false
        },
        depth: 1,
        names: [],
        isBlockScope: false
      }
    },
    {
      type: 'ExpressionStatement',
      start: 96,
      end: 111,
      expression: {
        type: 'CallExpression',
        start: 96,
        end: 110,
        callee: {
          type: 'Identifier',
          start: 96,
          end: 108,
          name: 'saySomething'
        },
        arguments: []
      }
    }
  ],
  sourceType: 'module',
  _scope: {
    parent: null,
    depth: 0,
    names: ['saySomething', 'saySomething'],
    isBlockScope: false
  }
};
