# verify-fail detail 可核驗測試證據（2026-08-02）

## 基準與範圍

- 綠燈提交：b1ea998f49c334308f8ad961d0e8a2b9be92bb4b
- 紅燈舊實作：ab72ae5526bb3dccb77271047c9aaf493d1394ae（0c47064^）
- Node.js：v25.1.0
- npm：11.6.2
- 目標測試檔：tests/verifyfail-detail.test.ts
- pass／skip 不變性測試檔：tests/verify.test.ts
- kernel 預算測試檔：tests/kernel-budget.test.ts

紅燈重現時只把 src/engines/verify-detail.ts 暫時換成上述舊提交內容，保留目前回歸測試；
取得輸出後立即恢復 HEAD 內容。恢復後 git diff --exit-code -- src/engines/verify-detail.ts
為 0，再執行同一目標測試取得綠燈。這能直接證明目前測試會攔下舊實作的兩個缺陷，
而不是只提供匿名通過數。

## 紅燈：目前回歸測試對舊實作

命令：

~~~powershell
npx vitest run tests/verifyfail-detail --reporter=verbose
~~~

退出碼：1（預期紅燈）。

完整輸出：

~~~text
 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/d5732e83

 ✓ tests/verifyfail-detail.test.ts > ANSI Vitest 輸出保留失敗名稱、AssertionError 鄰近內容與末尾統計 2ms
 × tests/verifyfail-detail.test.ts > 超長 Vitest 鄰近行仍同時保留失敗名稱、AssertionError 與統計 9ms
   → expected 'FAIL tests/oversized.test.ts > suite …' to contain 'AssertionError: expected false to be …'
 ✓ tests/verifyfail-detail.test.ts > 接近實際 Vitest 結構時，尾端通過列表不會擠掉失敗病灶 1ms
 × tests/verifyfail-detail.test.ts > 清除 C1 ANSI 序列，只把最後一組統計附加在 detail 末尾 1ms
   → expected '\u009b31mFAIL tests/first.test.ts > f…' not to contain '\u009b'
 ✓ tests/verifyfail-detail.test.ts > 非 Vitest 且無失敗標記時回退清理後的合併輸出尾段 1ms
 ✓ tests/verifyfail-detail.test.ts > 空的非 Vitest 輸出回傳空 detail 且維持長度上限 0ms

 Test Files  1 failed (1)
      Tests  2 failed | 4 passed (6)
   Start at  16:45:17
   Duration  337ms (transform 43ms, setup 31ms, import 34ms, tests 16ms, environment 0ms)


⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/verifyfail-detail.test.ts > 超長 Vitest 鄰近行仍同時保留失敗名稱、AssertionError 與統計
AssertionError: expected 'FAIL tests/oversized.test.ts > suite …' to contain 'AssertionError: expected false to be …'

- Expected
+ Received

- AssertionError: expected false to be true
+ FAIL tests/oversized.test.ts > suite > keeps useful diagnostics
+ debug payload: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
+  Test Files  1 failed | 2 passed (3)
+       Tests  1 failed | 4 passed (5)

 ❯ tests/verifyfail-detail.test.ts:39:18
     37|
     38|   expect(detail).toContain('FAIL tests/oversized.test.ts > suite > kee…
     39|   expect(detail).toContain('AssertionError: expected false to be true')
       |                  ^
     40|   expect(detail).toContain('Test Files  1 failed | 2 passed (3)')
     41|   expect(detail).toContain('Tests  1 failed | 4 passed (5)')

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯

 FAIL  tests/verifyfail-detail.test.ts > 清除 C1 ANSI 序列，只把最後一組統計附加在 detail 末尾
AssertionError: expected '\u009b31mFAIL tests/first.test.ts > f…' not to contain '\u009b'

- Expected
+ Received

- 
+ 31mFAIL tests/first.test.ts > first0m
+ first context
+ retrying
+ × tests/final.test.ts > final
+ final context
+  Test Files  2 failed | 1 passed (3)
+       Tests  2 failed | 1 passed (3)
+  Test Files  1 failed | 2 passed (3)
+       Tests  1 failed | 2 passed (3)

 ❯ tests/verifyfail-detail.test.ts:79:22
     77|   ].join('\n'))
     78|
     79|   expect(detail).not.toContain('\u009B')
       |                      ^
     80|   expect(detail).not.toContain('2 failed | 1 passed')
     81|   expect(detail).toContain('FAIL tests/first.test.ts > first')

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯
~~~

## 綠燈：恢復 HEAD 後同一目標測試

命令：

~~~powershell
npx vitest run tests/verifyfail-detail --reporter=verbose
~~~

退出碼：0。

完整輸出（同時列出 6 個可核驗案例名稱）：

~~~text
 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/d5732e83

 ✓ tests/verifyfail-detail.test.ts > ANSI Vitest 輸出保留失敗名稱、AssertionError 鄰近內容與末尾統計 4ms
 ✓ tests/verifyfail-detail.test.ts > 超長 Vitest 鄰近行仍同時保留失敗名稱、AssertionError 與統計 1ms
 ✓ tests/verifyfail-detail.test.ts > 接近實際 Vitest 結構時，尾端通過列表不會擠掉失敗病灶 1ms
 ✓ tests/verifyfail-detail.test.ts > 清除 C1 ANSI 序列，只把最後一組統計附加在 detail 末尾 0ms
 ✓ tests/verifyfail-detail.test.ts > 非 Vitest 且無失敗標記時回退清理後的合併輸出尾段 1ms
 ✓ tests/verifyfail-detail.test.ts > 空的非 Vitest 輸出回傳空 detail 且維持長度上限 0ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  16:45:37
   Duration  366ms (transform 54ms, setup 39ms, import 40ms, tests 8ms, environment 0ms)
~~~

## 規格原訂 dot 驗收

命令：

~~~powershell
npx vitest run tests/verifyfail-detail --reporter=dot
~~~

退出碼：0。

完整輸出：

~~~text
 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/d5732e83

······

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  16:37:38
   Duration  258ms (transform 37ms, setup 28ms, import 28ms, tests 5ms, environment 0ms)
~~~

## pass／skip 路徑不變性

命令：

~~~powershell
npx vitest run tests/verify.test.ts --reporter=verbose
~~~

退出碼：0。

完整輸出：

~~~text
 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/d5732e83

 ✓ tests/verify.test.ts > 無 command → skip 2ms
 ✓ tests/verify.test.ts > exit 0 → pass 63ms
 ✓ tests/verify.test.ts > exit 1 → fail 且 detail 含輸出 67ms
 ✓ tests/verify.test.ts > 無失敗特徵行時，清理 ANSI 後 detail 回退為尾段 1000 字 78ms
 ✓ tests/verify.test.ts > verify fail detail：移除 ANSI、保留失敗行鄰近上下文與末尾統計 1ms
 ✓ tests/verify.test.ts > verify fail detail：保留失敗與統計行且不超過 1000 字元 0ms
 ✓ tests/verify.test.ts > verify fail detail：非 Vitest 無法辨識失敗行時，回退合併輸出尾段且清理 ANSI 0ms
 ✓ tests/verify.test.ts > timeout → skip 不算 fail（附 detail） 1858ms
 ✓ tests/verify.test.ts > exit 9009/127（command not found）→ skip 不算 fail 139ms
 ✓ tests/verify.test.ts > 指令不存在（bare name 亂打）→ skip 不算 fail 110ms
 ✓ tests/verify.test.ts > 對抗性反例：真測試失敗，stderr 引號開頭斷言 + 混入亂碼(U+FFFD) → 仍必須是 fail（不可誤放行成 skip） 114ms
 ✓ tests/verify.test.ts > bare name 不存在（探測法）→ skip 且 detail 含 command-not-found 0ms
 ✓ tests/verify.test.ts > 含路徑分隔符但檔案不存在 → skip（探測法，existsSync 直接判斷） 0ms

 Test Files  1 passed (1)
      Tests  13 passed (13)
   Start at  16:38:04
   Duration  2.68s (transform 52ms, setup 27ms, import 48ms, tests 2.44s, environment 0ms)
~~~

## kernel 行數預算

命令：

~~~powershell
npx vitest run tests/kernel-budget.test.ts --reporter=verbose
~~~

退出碼：0。

完整輸出：

~~~text
 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/d5732e83

 ✓ tests/kernel-budget.test.ts > kernel 行數預算守門 > kernel 頂層行數 ≤ 工作上限 2700 3ms
 ✓ tests/kernel-budget.test.ts > kernel 行數預算守門 > 計數與 wc -l 一致且非平凡（防守門空轉） 2ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  16:38:13
   Duration  219ms (transform 24ms, setup 24ms, import 16ms, tests 6ms, environment 0ms)
~~~

## 建置、型別與全量測試

npm run build 退出碼：0。完整輸出：

~~~text
> autodev-ng@0.1.0 build
> tsc -p tsconfig.build.json
~~~

npm run typecheck 退出碼：0。完整輸出：

~~~text
> autodev-ng@0.1.0 typecheck
> tsc --noEmit
~~~

npm test 退出碼：0。完整輸出：

~~~text
> autodev-ng@0.1.0 test
> vitest run


 RUN  v4.1.9 D:/Users/Administrator/Desktop/autodev-ng/data/autodev-self/worktrees/d5732e83


 Test Files  147 passed (147)
      Tests  1513 passed (1513)
   Start at  16:38:34
   Duration  308.13s (transform 5.82s, setup 988ms, import 18.58s, tests 258.49s, environment 16ms)

fatal: cannot change to 'C:\Users\ADMINI~1\AppData\Local\Temp\adng-ch-not-exist-xyz': No such file or directory
~~~

最後一行是既有 commit-hash 容錯測試刻意觸發的 stderr；Vitest 與命令退出碼仍為 0。
