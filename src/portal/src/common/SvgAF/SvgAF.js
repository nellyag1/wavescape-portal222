// +----------------------------------------------------------------------------
// | Copyright (c) 2021 Pivotal Commware
// | All rights reserved.
// +----------------------------------------------------------------------------

import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import classNames from "classnames";
import "./SvgAF.css";

/* Class for svgs with active formatting
    Props:
        img - the default svg to use
        hover - the svg to use when hovered
        forceHover - forces the hover svg to be displayed
        tooltip - text supplied to the ReactToolTip
*/
export default class SvgAF extends Component {
  constructor(props) {
    super(props);

    this.state = {
      img: props.img,
      hovered: false,
    };
  }

  componentDidMount() {
    //ReactTooltip.show(this.ref);
    /* this code will make an SvgAF detect if it is already being hovered if it gets rendered under the mouse 
           (firefox seems to create an onMouseEnter event anyway, but chrome won't at least until the mouse is moved). */
  }

  componentDidUpdate(prevProps) {
    if (prevProps.img !== this.props.img || prevProps.hover !== this.props.hover) {
      if (this.state.hovered) {
        this.setState({
          img: this.props.hover
        });
      } else {
        this.setState({
          img: this.props.img
        });
      }
    }
  }

  render() {
    let icon = null;

    if (this.props.active) {
      icon = this.props.active;
    } else if (this.props.forceHover) {
      icon = this.props.hover;
    } else {
      icon = this.state.img;
    }

    return (
      <div
        key={this.props.tooltip}
        onClick={() => {
          if (this.props.onClick != null) {
            this.props.onClick();
          }
          ReactTooltip.show(this.ref);
        }}
        className={classNames({
          SvgAF: true,
          SvgAF_Div_Hover: this.state.hovered || this.props.forceHover
        })}
        ref={(ref) => (this.ref = ref)}
        data-tip={this.props.tooltip ? this.props.tooltip : null}
        onMouseEnter={() => {
          if (this.props.hover) {
            this.setState({ img: this.props.hover, hovered: true });
          }
          ReactTooltip.show(this.ref);
        }}
        onMouseLeave={() => {
          if (this.props.hover && this.state.hovered) {
            this.setState({ img: this.props.img, hovered: false });
          }
          ReactTooltip.hide(this.ref);
        }}
      >
        {
          //if the icon is an object (react component) then we can display it directly. otherwise it should be a string and we can use it as the source for an <img>
          typeof icon === "object" ? (
            icon
          ) : (
            <img
              className={classNames({ SvgAF_Img_Scale: this.props.scaleImg })}
              src={icon}
              alt={this.props.alt ? this.props.alt : ""}
            />
          )
        }
      </div>
    );
  }
}

export class IconAndText extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false
    };
  }

  render() {
    if (this.props.reverse) {
      return (
        <div
          className={classNames({
            IconAndText: true,
            IconAndText_Hovered: this.state.hovered
          })}
          onClick={this.props.onClick}
          onMouseEnter={() => this.setState({ hovered: true })}
          onMouseLeave={() => this.setState({ hovered: false })}
          data-tip={this.props.tooltip}
        >
          <span
            className={classNames({
              IconAndText_Text: true,
              IconAndText_Hidden: this.props.hidden
            })}
          >
            {this.props.text}
          </span>
          <SvgAF
            img={this.props.img}
            hover={this.props.hoverImg}
            forceHover={this.state.hovered}
          />
        </div>
      );
    } else {
      return (
        <div
          className={classNames({
            IconAndText: true,
            IconAndText_Hovered: this.state.hovered
          })}
          onClick={this.props.onClick}
          onMouseEnter={() => this.setState({ hovered: true })}
          onMouseLeave={() => this.setState({ hovered: false })}
          data-tip={this.props.tooltip}
        >
          <SvgAF
            img={this.props.img}
            hover={this.props.hoverImg}
            forceHover={this.state.hovered}
          />
          <span
            className={classNames({
              IconAndText_Text: true,
              IconAndText_Hidden: this.props.hidden,
            })}
          >
            {this.props.text}
          </span>
        </div>
      );
    }
  }
}
