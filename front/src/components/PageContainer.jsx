function PageContainer({ title, children }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">
        {title}
      </h1>

      {children}
    </div>
  );
}

export default PageContainer;