import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {Link, useHistory, useLocation} from "react-router-dom";

export const DelayLink = props => {
  const { delay, onDelayStart, onDelayEnd, replace, to, ...rest } = props;
  let timeout = null;
  let history = useHistory();
  let location = useLocation();

  useEffect(() => {
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [timeout]);

  const handleClick = e => {
    // if trying to navigate to current page stop everything
    if (location?.pathname === to) return;

    onDelayStart(e, to);
    if (e.defaultPrevented) {
      return;
    }

    e.preventDefault();

    timeout = setTimeout(() => {
      if (replace) {
        history.replace(to);
      } else {
        history.push(to);
      }
      onDelayEnd(e, to);
    }, delay);
  };

  return <Link {...rest} to={to} onClick={handleClick} />;
};

DelayLink.propTypes = {
  delay: PropTypes.number,
  onDelayStart: PropTypes.func,
  onDelayEnd: PropTypes.func,
  replace: PropTypes.bool,
  to: PropTypes.string
};

DelayLink.defaultProps = {
  replace: false,
  delay: 0,
  onDelayStart: () => {},
  onDelayEnd: () => {}
};

export default DelayLink;