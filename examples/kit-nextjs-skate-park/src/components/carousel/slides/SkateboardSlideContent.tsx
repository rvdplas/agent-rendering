import { JSX } from 'react';
import { Text } from '@sitecore-content-sdk/nextjs';
import StructuredData from 'components/structured-data/StructuredData';
import { buildProductJsonLd } from 'src/lib/structured-data/schema';
import { SkateboardSlide } from '../carousel.props';
import { HeadingTag, SlideFigure } from './SlideFigure';

// Renderer for the Skateboard template: adds schema.org Product markup around the shared base fields.
export const SkateboardSlideContent = ({
  slide,
  headingLevel,
}: {
  slide: SkateboardSlide;
  headingLevel: HeadingTag;
}): JSX.Element => {
  const { Title, Description, Image, Link, Price } = slide.fields;

  return (
    <>
      <SlideFigure
        fields={slide.fields}
        headingLevel={headingLevel}
        itemType="https://schema.org/Product"
        titleItemProp="name"
        descriptionItemProp="description"
        imageItemProp="image"
        extra={
          Price?.value && (
            // <data> ties the human-readable price to a machine-readable value; itemProp nests it as the Product's Offer price.
            // The sr-only label survives HTML-to-Markdown flattening (unlike itemProp/value attrs), giving agents an explicit "Price:" cue.
            <data value={Price.value} itemProp="offers" className="block text-2xl font-bold text-primary">
              <span className="sr-only">Price: </span>
              <Text field={Price} />
            </data>
          )
        }
      />
      <StructuredData
        id={`jsonld-product-slide-${slide.id}`}
        data={buildProductJsonLd({
          name: Title?.value ? String(Title.value) : undefined,
          descriptionHtml: Description?.value ? String(Description.value) : undefined,
          image: Image?.value?.src,
          url: Link?.value?.href,
          priceText: Price?.value,
        })}
      />
    </>
  );
};
