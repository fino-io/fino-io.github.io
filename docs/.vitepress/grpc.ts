const grpcArticle = /^(?:grpc\/(?:guides|blog)|generated\/grpc-(?:guides|blog))\/[\w-]+(?:_zh)?\.md$/

export function isGrpcArticle(relativePath: string) {
  return grpcArticle.test(relativePath)
}
