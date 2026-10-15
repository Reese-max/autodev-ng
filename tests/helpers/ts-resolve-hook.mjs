// 測試用 loader：Node 原生 strip-types 不會把 .js specifier 解析回 .ts，
// 多進程鎖測試需要子進程直接跑 src/ TypeScript。失敗才嘗試 .ts，成功路徑零成本。
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context)
  } catch (err) {
    if (err?.code === 'ERR_MODULE_NOT_FOUND' && specifier.endsWith('.js') && (specifier.startsWith('./') || specifier.startsWith('../'))) {
      return next(`${specifier.slice(0, -3)}.ts`, context)
    }
    throw err
  }
}
