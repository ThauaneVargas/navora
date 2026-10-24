import test from 'node:test';
import assert from 'node:assert/strict';
import pt from './pt.js';
import en from './en.js';
import es from './es.js';

const keys = (node, prefix = '') =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === 'object' ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

const params = (text) => (String(text).match(/\{\w+\}/g) || []).sort().join(',');

const lookup = (dictionary, key) => key.split('.').reduce((node, part) => node?.[part], dictionary);

for (const [name, dictionary] of [['en', en], ['es', es]]) {
  test(`${name} tem exatamente as mesmas chaves do português`, () => {
    const ptKeys = keys(pt).sort();
    const otherKeys = keys(dictionary).sort();
    assert.deepEqual(ptKeys.filter((key) => !otherKeys.includes(key)), [], 'faltando');
    assert.deepEqual(otherKeys.filter((key) => !ptKeys.includes(key)), [], 'sobrando');
  });

  test(`${name} mantém os mesmos {parâmetros} de cada texto`, () => {
    for (const key of keys(pt)) {
      assert.equal(params(lookup(dictionary, key)), params(lookup(pt, key)), key);
    }
  });
}
