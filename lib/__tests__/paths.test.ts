import { expect, test } from '@jest/globals';
import { isValidFilePath, isValidFolderPath } from "../paths";

test.each`
  path	                | expected
  ${"/a.jpg"}	          | ${true}
  ${"a/a.jpg"}	        | ${true}
  ${"/a/a.jpg"}	        | ${true}
  ${"/a/b/c/d/e.jpg"}	  | ${true}
  ${"/a/b/c/d/e_e.jpg"}	  | ${true}
  ${"/a/b/c/d/e-e.jpg"}	  | ${true}
  ${"/a/b/c/d/e..jpg"}	| ${false}
  ${""}	                | ${false}
  ${"/a"}	              | ${false}
  ${"a/a"}	            | ${false}
  ${"a/a./"}	          | ${false}
`('validPath($path)', ({ path, expected }) => {
  expect(isValidFilePath(path as string)).toBe(expected);
});

test.each`
  path	                | expected
  ${"/**"}	            | ${false}
  ${"a/**"}	            | ${false}
  ${"/a/**"}	          | ${true}
  ${"/a/b/c/d/**"}	    | ${true}
  ${"/a/b/c/d-e/**"}	    | ${true}
  ${"/a/b/c/d/**.jpg"}	| ${false}
  ${""}	                | ${false}
  ${"/a"}	              | ${false}
  ${"a/a"}	            | ${false}
  ${"a/a./**"}	          | ${false}
`('isValidPathForFolder($path)', ({ path, expected }) => {
  expect(isValidFolderPath(path as string)).toBe(expected);
});