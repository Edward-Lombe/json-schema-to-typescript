"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cli_color_1 = require("cli-color");
var lodash_1 = require("lodash");
var index_1 = require("./index");
var AST_1 = require("./types/AST");
var utils_1 = require("./utils");
function generate(ast, options) {
    if (options === void 0) { options = index_1.DEFAULT_OPTIONS; }
    return [
        options.bannerComment,
        declareNamedTypes(ast, options, ast.standaloneName),
        declareNamedInterfaces(ast, options, ast.standaloneName),
        declareEnums(ast, options)
    ]
        .filter(Boolean)
        .join('\n\n')
        + '\n'; // trailing newline
}
exports.generate = generate;
function declareEnums(ast, options, processed) {
    if (processed === void 0) { processed = new Set(); }
    if (processed.has(ast)) {
        return '';
    }
    processed.add(ast);
    var type = '';
    switch (ast.type) {
        case 'ENUM':
            type = generateStandaloneEnum(ast, options) + '\n';
            break;
        case 'ARRAY':
            return declareEnums(ast.params, options, processed);
        case 'TUPLE':
            return ast.params.reduce(function (prev, ast) { return prev + declareEnums(ast, options, processed); }, '');
        case 'INTERFACE':
            type = getSuperTypesAndParams(ast).reduce(function (prev, ast) {
                return prev + declareEnums(ast, options, processed);
            }, '');
            break;
        default:
            return '';
    }
    return type;
}
function declareNamedInterfaces(ast, options, rootASTName, processed) {
    if (processed === void 0) { processed = new Set(); }
    if (processed.has(ast)) {
        return '';
    }
    processed.add(ast);
    var type = '';
    switch (ast.type) {
        case 'ARRAY':
            type = declareNamedInterfaces(ast.params, options, rootASTName, processed);
            break;
        case 'INTERFACE':
            type = [
                AST_1.hasStandaloneName(ast) && (ast.standaloneName === rootASTName || options.declareExternallyReferenced) && generateStandaloneInterface(ast, options),
                getSuperTypesAndParams(ast).map(function (ast) {
                    return declareNamedInterfaces(ast, options, rootASTName, processed);
                }).filter(Boolean).join('\n')
            ].filter(Boolean).join('\n');
            break;
        case 'INTERSECTION':
        case 'UNION':
            type = ast.params.map(function (_) { return declareNamedInterfaces(_, options, rootASTName, processed); }).filter(Boolean).join('\n');
            break;
        default:
            type = '';
    }
    return type;
}
function declareNamedTypes(ast, options, rootASTName, processed) {
    if (processed === void 0) { processed = new Set(); }
    if (processed.has(ast)) {
        return '';
    }
    processed.add(ast);
    var type = '';
    switch (ast.type) {
        case 'ARRAY':
            type = [
                declareNamedTypes(ast.params, options, rootASTName, processed),
                AST_1.hasStandaloneName(ast) ? generateStandaloneType(ast, options) : undefined
            ].filter(Boolean).join('\n');
            break;
        case 'ENUM':
            type = '';
            break;
        case 'INTERFACE':
            type = getSuperTypesAndParams(ast).map(function (ast) {
                return (ast.standaloneName === rootASTName || options.declareExternallyReferenced) && declareNamedTypes(ast, options, rootASTName, processed);
            })
                .filter(Boolean).join('\n');
            break;
        case 'INTERSECTION':
        case 'TUPLE':
        case 'UNION':
            type = [
                AST_1.hasStandaloneName(ast) ? generateStandaloneType(ast, options) : undefined,
                ast.params.map(function (ast) { return declareNamedTypes(ast, options, rootASTName, processed); }).filter(Boolean).join('\n')
            ].filter(Boolean).join('\n');
            break;
        default:
            if (AST_1.hasStandaloneName(ast)) {
                type = generateStandaloneType(ast, options);
            }
    }
    return type;
}
function generateType(ast, options) {
    utils_1.log(cli_color_1.whiteBright.bgMagenta('generator'), ast);
    if (AST_1.hasStandaloneName(ast)) {
        return utils_1.toSafeString(ast.standaloneName);
    }
    switch (ast.type) {
        case 'ANY': return 'any';
        case 'ARRAY': return (function () {
            var type = generateType(ast.params, options);
            return type.endsWith('"') ? '(' + type + ')[]' : type + '[]';
        })();
        case 'BOOLEAN': return 'boolean';
        case 'INTERFACE': return generateInterface(ast, options);
        case 'INTERSECTION': return generateSetOperation(ast, options);
        case 'LITERAL': return JSON.stringify(ast.params);
        case 'NUMBER': return 'number';
        case 'NULL': return 'null';
        case 'OBJECT': return 'object';
        case 'REFERENCE': return ast.params;
        case 'STRING': return 'string';
        case 'TUPLE': return '['
            + ast.params.map(function (_) { return generateType(_, options); }).join(', ')
            + ']';
        case 'UNION': return generateSetOperation(ast, options);
        case 'CUSTOM_TYPE': return ast.params;
    }
}
/**
 * Generate a Union or Intersection
 */
function generateSetOperation(ast, options) {
    var members = ast.params.map(function (_) { return generateType(_, options); });
    var separator = ast.type === 'UNION' ? '|' : '&';
    return members.length === 1 ? members[0] : '(' + members.join(' ' + separator + ' ') + ')';
}
function generateInterface(ast, options) {
    return "{"
        + '\n'
        + ast.params
            .filter(function (_) { return !_.isPatternProperty && !_.isUnreachableDefinition; })
            .map(function (_a) {
            var isRequired = _a.isRequired, keyName = _a.keyName, ast = _a.ast;
            return [isRequired, keyName, ast, generateType(ast, options)];
        })
            .map(function (_a) {
            var isRequired = _a[0], keyName = _a[1], ast = _a[2], type = _a[3];
            return (AST_1.hasComment(ast) && !ast.standaloneName ? generateComment(ast.comment) + '\n' : '')
                + escapeKeyName(keyName)
                + (isRequired ? '' : '?')
                + ': '
                + (AST_1.hasStandaloneName(ast) ? utils_1.toSafeString(type) : type);
        })
            .join('\n')
        + '\n'
        + '}';
}
function generateComment(comment) {
    return [
        '/**'
    ].concat(comment.split('\n').map(function (_) { return ' * ' + _; }), [
        ' */'
    ]).join('\n');
}
function generateStandaloneEnum(ast, options) {
    return (AST_1.hasComment(ast) ? generateComment(ast.comment) + '\n' : '')
        + 'export ' + (options.enableConstEnums ? 'const ' : '') + ("enum " + utils_1.toSafeString(ast.standaloneName) + " {")
        + '\n'
        + ast.params.map(function (_a) {
            var ast = _a.ast, keyName = _a.keyName;
            return keyName + ' = ' + generateType(ast, options);
        })
            .join(',\n')
        + '\n'
        + '}';
}
function generateStandaloneInterface(ast, options) {
    return (AST_1.hasComment(ast) ? generateComment(ast.comment) + '\n' : '')
        + ("export interface " + utils_1.toSafeString(ast.standaloneName) + " ")
        + (ast.superTypes.length > 0 ? "extends " + ast.superTypes.map(function (superType) { return utils_1.toSafeString(superType.standaloneName); }).join(', ') + " " : '')
        + generateInterface(ast, options);
}
function generateStandaloneType(ast, options) {
    return (AST_1.hasComment(ast) ? generateComment(ast.comment) + '\n' : '')
        + ("export type " + utils_1.toSafeString(ast.standaloneName) + " = " + generateType(lodash_1.omit(ast, 'standaloneName') /* TODO */, options));
}
function escapeKeyName(keyName) {
    if (keyName.length
        && /[A-Za-z_$]/.test(keyName.charAt(0))
        && /^[\w$]+$/.test(keyName)) {
        return keyName;
    }
    if (keyName === '[k: string]') {
        return keyName;
    }
    return JSON.stringify(keyName);
}
function getSuperTypesAndParams(ast) {
    return ast.params
        .map(function (param) { return param.ast; })
        .concat(ast.superTypes);
}
//# sourceMappingURL=generator.js.map