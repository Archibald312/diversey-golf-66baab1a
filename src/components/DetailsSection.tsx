import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const DetailsSection = () => {
  return <section id="faq" className="w-full bg-white py-0">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-elegant">
            {/* Card Header with background image instead of gradient */}
            <div className="relative h-48 sm:h-64 p-6 sm:p-8 flex items-end" style={{
            backgroundImage: "url('/background-section3.png')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}>
              <h2 className="text-2xl sm:text-3xl font-display text-white font-bold text-center">
                Frequently Asked Questions
              </h2>
            </div>
            
            {/* Card Content */}
            <div className="bg-white p-4 sm:p-8" style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #ECECEC"
          }}>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left font-semibold">
                    How much is the monthly membership?
                  </AccordionTrigger>
                  <AccordionContent>
                    Founding members pay $200 per month with no long-term commitment.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left font-semibold">
                    When will Diversey Indoor Golf open?
                  </AccordionTrigger>
                  <AccordionContent>
                    Diversey Indoor Golf is scheduled to open in the winter of 2026. Join the waitlist for updates on our progress.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left font-semibold">
                    Where will Diversey Indoor Golf be located?
                  </AccordionTrigger>
                  <AccordionContent>
                    Diversey Indoor Golf will be located within a 10-minute walk of Clark & Diversey.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left font-semibold">
                    Is it truly unlimited golf?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes! Your monthly membership gives you unlimited access to our golf simulators 24/7. Use our app to reserve your tee time.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left font-semibold">
                    Can I bring friends?
                  </AccordionTrigger>
                  <AccordionContent>
                    Absolutely! You're welcome to bring up to three guests to enjoy the simulators with you during your session.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What are your hours?
                  </AccordionTrigger>
                  <AccordionContent>
                    Our simulators are available 24/7/365 with your membership. You'll have key card access to play anytime.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* The form is now a separate component/section */}
        </div>
      </div>
    </section>;
};
export default DetailsSection;