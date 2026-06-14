import { Quote } from 'lucide-react';
import { STOCK_QUOTES } from './constants';

const QuoteCard = ({ text, author }) => (
  <figure className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-soft transition-shadow hover:shadow-md">
    <Quote className="h-5 w-5 shrink-0 text-primary/40" aria-hidden />
    <blockquote className="flex-1 text-sm leading-relaxed text-foreground">{text}</blockquote>
    <figcaption className="text-xs font-semibold text-muted">— {author}</figcaption>
  </figure>
);

export const QuotesSection = () => (
  <section>
    <h2 className="mb-6 text-xl font-semibold text-foreground">Wisdom from the markets</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STOCK_QUOTES.map((q) => (
        <QuoteCard key={q.author + q.text.slice(0, 20)} {...q} />
      ))}
    </div>
  </section>
);

export default QuotesSection;
