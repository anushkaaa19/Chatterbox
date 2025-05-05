const AuthImagePattern = ({ title, subtitle }) => {
    return (
      <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
        <div className="max-w-md text-center">
          {/* 9-square grid with LIGHTER opacity */}
          <div className="grid grid-cols-3 gap-3 mb-8 mx-auto w-[180px]">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-2xl bg-primary/20 ${  // Reduced to 20% opacity
                  i % 2 === 0 ? "animate-pulse opacity-40" : ""  // Pulsing squares get slightly darker
                }`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <p className="text-base-content/60">{subtitle}</p>
        </div>
      </div>
    );
  };
  export default AuthImagePattern;
