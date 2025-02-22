import React from 'react';

import { EmptyTabContent, Link } from 'storybook/internal/components';
import { styled } from 'storybook/internal/theming';

import { DocumentIcon, VideoIcon } from '@storybook/icons';

import { simpleMessage } from 'src/messages';

const Links = styled.div(({ theme }) => ({
  display: 'flex',
  fontSize: theme.typography.size.s2 - 1,
  gap: 25,
}));

const Divider = styled.div(({ theme }) => ({
  width: 1,
  height: 16,
  backgroundColor: theme.appBorderColor,
}));

export type EmptyTabContentType = {
  lang: string
}

export const Empty = (props:EmptyTabContentType) => {
    const lang = props.lang;

  return (
    <EmptyTabContent
      title="Azure Devops addon for Storybook"
      description={simpleMessage(lang, "noWorkItemsSet")}
      footer={
        <Links>
          {/* <Link href={TUTORIAL_VIDEO_LINK} target="_blank" withArrow>
            <VideoIcon /> {simpleMessage(lang, "watchVideo")}
          </Link>
          <Divider /> */}
          <Link href={"https://github.com/iamallyniam/sb-azure-devops/blob/main/README.md"} target="_blank" withArrow>
            <DocumentIcon /> {simpleMessage(lang, "readDocs")}
          </Link>
        </Links>
      }
    />
  );
};