export default function BulletinDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border bg-white p-5"
        style={{ borderColor: "var(--otto-rule)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="h-10 w-10 animate-pulse rounded-[10px]"
            style={{ background: "var(--otto-bg)" }}
          />
          <div className="space-y-2">
            <div
              className="h-5 w-64 animate-pulse rounded-[6px]"
              style={{ background: "var(--otto-bg)" }}
            />
            <div
              className="h-3 w-40 animate-pulse rounded-[6px]"
              style={{ background: "var(--otto-bg)" }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div
            className="h-9 w-28 animate-pulse rounded-[10px]"
            style={{ background: "var(--otto-bg)" }}
          />
          <div
            className="h-9 w-28 animate-pulse rounded-[10px]"
            style={{ background: "var(--otto-bg)" }}
          />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div
        className="flex gap-1 border-b pb-1"
        style={{ borderColor: "var(--otto-rule)" }}
      >
        {[80, 80, 70, 90].map((w, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-[6px]"
            style={{ background: "var(--otto-bg)", width: `${w}px` }}
          />
        ))}
      </div>

      {/* Content skeleton — categories with news */}
      <div
        className="rounded-[14px] border bg-white p-8"
        style={{ borderColor: "var(--otto-rule)" }}
      >
        {[1, 2].map((cat) => (
          <div key={cat} className="mb-10 last:mb-0">
            <div
              className="mb-4 h-3 w-40 animate-pulse rounded-[6px]"
              style={{ background: "var(--otto-bg)" }}
            />
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex gap-4 rounded-[12px] border p-3"
                  style={{ borderColor: "var(--otto-rule)" }}
                >
                  <div
                    className="h-[112px] w-[180px] flex-shrink-0 animate-pulse rounded-[8px]"
                    style={{ background: "var(--otto-bg)" }}
                  />
                  <div className="flex flex-1 flex-col gap-2">
                    <div
                      className="h-3 w-48 animate-pulse rounded-[6px]"
                      style={{ background: "var(--otto-bg)" }}
                    />
                    <div
                      className="h-5 w-full animate-pulse rounded-[6px]"
                      style={{ background: "var(--otto-bg)" }}
                    />
                    <div
                      className="h-5 w-3/4 animate-pulse rounded-[6px]"
                      style={{ background: "var(--otto-bg)" }}
                    />
                    <div
                      className="mt-1 h-3 w-full animate-pulse rounded-[6px]"
                      style={{ background: "var(--otto-bg)" }}
                    />
                    <div
                      className="h-3 w-2/3 animate-pulse rounded-[6px]"
                      style={{ background: "var(--otto-bg)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
