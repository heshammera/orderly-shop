"use client";

import React, { useEffect, useState } from 'react';
import { Plyr, APITypes, PlyrProps } from 'plyr-react';
import 'plyr-react/plyr.css';

const CustomPlyrPlayer = React.forwardRef<APITypes, PlyrProps>((props, ref) => {
    const { source, options, ...rest } = props;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !source) return null;

    return (
        <Plyr
            ref={ref}
            source={source}
            options={options}
            {...rest}
        />
    );
});

CustomPlyrPlayer.displayName = 'CustomPlyrPlayer';

export default CustomPlyrPlayer;
