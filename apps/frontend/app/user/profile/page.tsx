import ProfileForm from "./form";

export default function Profile() {
  return (
    <div className="my-16 mx-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl my-8">
        Profile
      </h1>
      <ProfileForm />
    </div>
)
}