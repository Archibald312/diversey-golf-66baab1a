import React, { useState } from "react";
import { toast } from "sonner";

const WaitlistForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const response = await fetch('/api/join-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to join waitlist", {
          style: {
            color: '#dc2626',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca'
          }
        });
        return;
      }
      toast.success("Request submitted successfully!");
      setFormData({ fullName: "", email: "" });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("An error occurred. Please try again.");
    }
  };
  
  return (
    <section id="waitlist" className="w-full bg-white py-0">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-elegant">
          <div className="relative h-48 sm:h-64 p-6 sm:p-8 flex flex-col items-start" style={{
            backgroundImage: "url('/background-section1.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}>
            <h2 className="text-2xl sm:text-3xl font-display text-white font-bold mt-auto">
              Join the Waitlist
            </h2>
            <h3 className="text-2xl sm:text-3xl font-display text-white font-bold mt-auto">
              Information about how to join the waitlist.
            </h3>
          </div>
          <div className="bg-white p-4 sm:p-8" style={{ backgroundColor: "#FFFFFF", border: "1px solid #ECECEC" }}>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <input 
                  type="text" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  placeholder="Full name" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:border-transparent" 
                  required 
                />
              </div>
              <div>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Email address" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:border-transparent" 
                  required 
                />
              </div>
              <div>
                <button 
                  type="submit" 
                  className="w-full px-6 py-3 bg-pulse-500 hover:bg-pulse-600 text-white font-medium rounded-full transition-colors duration-300"
                >
                  Join the Waitlist
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WaitlistForm;