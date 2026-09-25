import React, { JSX, ReactNode } from 'react';
import { NextImage as ContentSdkImage, RichText, Text } from '@sitecore-content-sdk/nextjs';
import { CompatibleLink } from 'components/content-sdk/CompatibleLink';
import { CarouselItemFields } from '../carousel.props';

export type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface SlideFigureProps {
  fields: CarouselItemFields;
  headingLevel: HeadingTag;
  // schema.org type for the slide as a whole, e.g. 'https://schema.org/Product'; omitted for generic slides.
  itemType?: string;
  titleItemProp?: string;
  descriptionItemProp?: string;
  imageItemProp?: string;
  // Type-specific markup (e.g. Price) rendered between title and description.
  extra?: ReactNode;
}

// Base layout shared by every slide type; type-specific renderers (Default, Skateboard, ...)
// supply only the schema.org itemProp wiring and any extra fields via props.
export const SlideFigure = ({
  fields,
  headingLevel,
  itemType,
  titleItemProp,
  descriptionItemProp,
  imageItemProp,
  extra,
}: SlideFigureProps): JSX.Element => {
  const { Title, Description, Image, Link } = fields;
  const hasImage = Boolean(Image?.value?.src);

  return (
    // Each slide is a self-contained, independently distributable unit (name/image/price/description), hence <article>.
    <article
      className="flex h-full flex-col gap-3"
      {...(itemType ? { itemScope: true, itemType } : {})}
    >
      {hasImage && (
        <figure>
          {/* figcaption leads (spec allows first-or-last child) so title/price/description read before the image, both visually and in flattened agent markdown. */}
          {(Title?.value || Description?.value || extra) && (
            <figcaption>
              {Title?.value && (
                <Text
                  tag={headingLevel}
                  field={Title}
                  itemProp={titleItemProp}
                  className="text-lg font-semibold"
                />
              )}
              {extra}
              {Description?.value && (
                <RichText
                  tag="div"
                  field={Description}
                  itemProp={descriptionItemProp}
                  className="text-sm text-gray-600"
                />
              )}
            </figcaption>
          )}
          <ContentSdkImage
            field={Image}
            itemProp={imageItemProp}
            className="aspect-video w-full rounded-md object-cover"
          />
        </figure>
      )}
      {!hasImage && Title?.value && (
        <Text
          tag={headingLevel}
          field={Title}
          itemProp={titleItemProp}
          className="text-lg font-semibold"
        />
      )}
      {!hasImage && extra}
      {!hasImage && Description?.value && (
        <RichText
          tag="div"
          field={Description}
          itemProp={descriptionItemProp}
          className="text-sm text-gray-600"
        />
      )}
      {Link?.value?.href && (
        <CompatibleLink field={Link} className="text-sm font-medium underline underline-offset-4" />
      )}
    </article>
  );
};
