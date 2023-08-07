import { isValidPath } from "../paths";

test.each`
  path	                | expected
  ${"/a.jpg"}	          | ${true}
  ${"a/a.jpg"}	        | ${true}
  ${"/a/a.jpg"}	        | ${true}
  ${"/a/b/c/d/e.jpg"}	  | ${true}
  ${"/a/b/c/d/e..jpg"}	| ${false}
  ${""}	                | ${false}
  ${"/a"}	              | ${false}
  ${"a/a"}	            | ${false}
  ${"a/a./"}	          | ${false}
`('validPath($path)', ({ path, expected }) => {
  expect(isValidPath(path)).toBe(expected);
});