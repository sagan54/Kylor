"use client";

export default function ExplorePage() {
  const items = [
    { type: "image", title: "Cinematic Forest", creator: "User 1" },
    { type: "video", title: "Space Launch Shot", creator: "User 2" },
    { type: "image", title: "Cyberpunk Street", creator: "User 3" },
    { type: "video", title: "Flying Car Scene", creator: "User 4" },
    { type: "image", title: "Fantasy Castle", creator: "User 5" },
    { type: "video", title: "Robot Battle", creator: "User 6" }
  ];

  return (
    <main
      style={{
        padding: "40px",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>Explore</h1>

      <p
        style={{
          color: "rgba(255,255,255,0.7)",
          marginBottom: "40px",
        }}
      >
        Discover creations built with Kylor AI.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              borderRadius: "18px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                height: "180px",
                background:
                  item.type === "video"
                    ? "linear-gradient(135deg,#6366f1,#7c3aed)"
                    : "linear-gradient(135deg,#0ea5e9,#22c55e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                opacity: 0.8,
              }}
            >
              {item.type === "video" ? "Video Preview" : "Image Preview"}
            </div>

            <div style={{ padding: "16px" }}>
              <h3 style={{ margin: 0 }}>{item.title}</h3>

              <p
                style={{
                  marginTop: "6px",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                by {item.creator}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
<button
onClick={generateBreakdown}
className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
>
Break Into Scenes
</button>