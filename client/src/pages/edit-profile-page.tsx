// This is a simplified version of edit-profile-page.tsx for Netlify deployment
import React from "react";

// Define the ExperienceLevel enum directly in this file to avoid import issues
enum ExperienceLevel {
  LessThanOneYear = "Less than 1 year",
  TwoToFiveYears = "2-5 years",
  FiveToTenYears = "5-10 years",
  TenPlusYears = "10+ years"
}

// Create a default export that matches what App.tsx is importing
export default function EditProfilePage() {
  return (
    <div className="container mx-auto p-4 mt-4">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <p>This is a simplified version of the profile editor for Netlify deployment.</p>
      <p className="mt-4">Your actual profile editing functionality will work correctly when using the backend API.</p>
    </div>
  );
}