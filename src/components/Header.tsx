const PROFILE_URL = "https://i.imgur.com/r4ctDfv.jpeg";

const Header = () => {
  return (
    <header className="w-full text-center py-12 px-4 glass-effect rounded-b-3xl shadow-2xl mb-8">
      <div className="relative w-24 h-24 mx-auto mb-4">
        <img 
          src={PROFILE_URL} 
          alt="Lau Lau Talk Profile" 
          className="w-full h-full object-cover rounded-full border-4 border-brand-primary shadow-lg animate-glow" 
        />
      </div>
      <h1 className="text-4xl font-bold text-brand-primary mb-2">
        Lau Lau Talk 🎙️
      </h1>
      <p className="text-text-secondary font-medium">
        A collection of thoughts, photos, and videos.
      </p>
    </header>
  );
};

export default Header;