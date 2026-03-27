import { motion } from 'framer-motion';

export default function BlurText({ text, delay = 0, className = "" }) {
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay * i, ease: [0.16, 1, 0.3, 1] }
    }),
  };

  const child = {
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)", 
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
    },
    hidden: { 
      opacity: 0, 
      y: 40, 
      filter: "blur(12px)" 
    },
  };

  return (
    <motion.span
      className={`inline-flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {words.map((word, idx) => (
        <motion.span key={idx} className="mr-1.5 inline-block" variants={child}>
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
