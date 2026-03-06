"use client";

import React from 'react';
import { APITypes, PlyrProps, usePlyr } from 'plyr-react';

const CustomPlyrPlayer = React.forwardRef<APITypes, PlyrProps>((props, ref) => {
    const { source, options = null } = props;
    const raptorRef = usePlyr(ref, { options, source });
    return <video ref={raptorRef as React.LegacyRef<HTMLVideoElement>} className="plyr-react plyr" />;
});

export default CustomPlyrPlayer;
