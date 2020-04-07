import React from "react";
import { Typography } from "antd";
import Neighborhoods from "../CityData/Neighborhoods";
import Areas from "../CityData/Areas";
import axios from "axios";
import { SuggestedPlaceCards } from "./SuggestedPlaceCards";

const { Title } = Typography;

var neighborhoodList = "";

function AreaDropdown(props) {
  return (
    <select
      className="area-picker"
      value={props.currentArea}
      onChange={event => {
        const newArea = event.target.value;
        props.updateArea(newArea);
      }}
    >
      <option value="CPT">Cape Town</option>
      <option value="JHB">Johannesburg</option>
      <option value="DBN">Durban</option>
    </select>
  );
}

export class NeighborhoodCards extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestedPlaces: null,
      selectedNeighborhood: null,
      offset: 0,
      fetchOffset: 0,
      windowWidth: 0,
      loading: true,
      neighborhoods: [],
      showingNeighborhoodsFor: props.currentArea
    };
  }

  neighborhoodsForArea = async area => {
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    if (!this.neighborhoodList || this.neighborhoodList.length == 0) {
      this.neighborhoodList = await this.fetchNeighborhoodList(this);
    }

    //    const neighborhoods = Neighborhoods[area] || [];
    const neighborhoods = this.neighborhoodList[area] || [];

    if (neighborhoods && neighborhoods.length > 0) {
      shuffleArray(neighborhoods);
    }
    return neighborhoods;
  };

  componentDidMount = async () => {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
    let newNeighborhoods = await this.neighborhoodsForArea(
      this.props.currentArea
    );
    this.setState({
      neighborhoods: newNeighborhoods,
      loading: true
    });
    this.fetchSuggestionsForNeighborhood(this.state.neighborhoods[0], this, 0);
  };
  componentWillUnmount = () => {
    window.removeEventListener("resize", this.updateWindowDimensions);
  };
  componentDidUpdate = (prevProps, prevState) => {
    if (prevProps.currentArea !== this.props.currentArea) {
      const newNeighborhoods = this.neighborhoodsForArea(
        this.props.currentArea
      );
      this.setState({
        selectedNeighborhood: newNeighborhoods[0],
        loading: true,
        suggestedPlaces: null,
        offset: 0,
        neighborhoods: newNeighborhoods
      });
      this.fetchSuggestionsForNeighborhood(newNeighborhoods[0], this, 0);
    }
  };
  updateWindowDimensions = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  // request = async props => {
  //   await this.fetchNeighborhoodList(this);
  //   console.log("IA 123...");
  //
  //   const neighborhoods = this.neighborhoodsForArea(props.currentArea);
  //
  //   console.log("IA ...", neighborhoods);
  //
  //   this.state = {
  //     suggestedPlaces: null,
  //     selectedNeighborhood: neighborhoods[0],
  //     offset: 0,
  //     fetchOffset: 0,
  //     windowWidth: 0,
  //     loading: true,
  //     neighborhoods: neighborhoods,
  //     showingNeighborhoodsFor: props.currentArea
  //   };
  //   this.ref = React.createRef();
  // };

  fetchSuggestionsForNeighborhood(neighborhood, ref, fetchOffset) {
    this.setState({ loading: true });
    axios
      .get("/api/places/by_neighborhood", {
        params: {
          neighborhood: neighborhood.key,
          offset: fetchOffset
        }
      })
      .then(response => {
        const suggestions = response.data.suggestedPlaces;
        const moreAvailable = response.data.moreAvailable;
        const merged = (this.state.suggestedPlaces || []).concat(suggestions);
        ref.setState((state, props) => {
          const nextOffset = state.fetchOffset + suggestions.length;
          return {
            loading: false,
            suggestedPlaces: merged,
            fetchOffset: nextOffset,
            moreAvailable: moreAvailable
          };
        });
      })
      .catch(error => {
        ref.setState({ loading: false });
      });
  }

  fetchNeighborhoodList(ref) {
    this.setState({ loading: true });
    return axios
      .get("api/places/neighborhood/list", {
        params: {}
      })
      .then(response => {
        return response.data;
      });
  }

  loadMoreForCurrentNeighborhood() {
    this.fetchSuggestionsForNeighborhood(
      this.state.selectedNeighborhood,
      this,
      this.state.fetchOffset
    );
  }

  getCardsForCurrentPage() {
    const neighborhoodCards = this.state.neighborhoods
      .slice(this.state.offset)
      .map(neighborhood => {
        return (
          <div
            key={neighborhood.key}
            className="neighborhood-card"
            style={{ textAlign: "center" }}
          >
            <div
              className={
                "neighborhood-card-image" +
                (this.state.selectedNeighborhood &&
                this.state.selectedNeighborhood.key === neighborhood.key
                  ? " neighborhood-card-image-selected"
                  : "")
              }
              onClick={event => {
                this.setState({
                  selectedNeighborhood: neighborhood,
                  fetchOffset: 0,
                  suggestedPlaces: null
                });
                this.fetchSuggestionsForNeighborhood(neighborhood, this, 0);
              }}
            >
              <div
                className={
                  "neighborhood-card-title" +
                  (this.state.selectedNeighborhood &&
                  this.state.selectedNeighborhood.key === neighborhood.key
                    ? " neighborhood-card-title-selected"
                    : "")
                }
              >
                {neighborhood.name}
              </div>
            </div>
          </div>
        );
      });
    return neighborhoodCards;
  }

  render() {
    return (
      <>
        <div className="explore-neighborhood-section">
          <Title className="section-title" level={4}>
            Or explore by neighborhood in{" "}
            <AreaDropdown
              currentArea={this.props.currentArea}
              updateArea={this.props.updateArea}
            />
          </Title>
        </div>
        {
          <section
            className="neighborhood-card-container"
            style={{
              maxWidth:
                this.state.windowWidth >= 576
                  ? this.state.windowWidth - 200
                  : this.state.windowWidth
            }}
          >
            {this.state.offset !== 0 && (
              <a
                className={
                  "neighborhood-card-arrow neighborhood-card-arrow-left " +
                  (this.state.offset >= this.state.neighborhoods.length - 1
                    ? "neighborhood-card-arrow-disabled"
                    : "")
                }
                onClick={event => {
                  this.setState({
                    offset: Math.max(0, this.state.offset - 1)
                  });
                }}
              >
                {"‹"}
              </a>
            )}
            {this.getCardsForCurrentPage()}
            {this.state.offset < this.state.neighborhoods.length - 1 && (
              <a
                className={
                  "neighborhood-card-arrow neighborhood-card-arrow-right " +
                  (this.state.offset >= this.state.neighborhoods.length - 1
                    ? "neighborhood-card-arrow-disabled"
                    : "")
                }
                onClick={event => {
                  this.setState({
                    offset: Math.min(
                      this.state.neighborhoods.length - 1,
                      this.state.offset + 1
                    )
                  });
                }}
              >
                ›
              </a>
            )}
          </section>
        }
        {(this.state.loading ||
          (this.state.suggestedPlaces &&
            this.state.suggestedPlaces.length > 0)) && (
          <SuggestedPlaceCards
            passRef={this.ref}
            suggestedPlaces={this.state.suggestedPlaces}
            moreAvailable={this.state.moreAvailable}
            onLoadMore={() => {
              this.loadMoreForCurrentNeighborhood();
            }}
          />
        )}

        {this.state.suggestedPlaces &&
          this.state.suggestedPlaces.length === 0 &&
          this.state.selectedNeighborhood && (
            <p>No results for {this.state.selectedNeighborhood.name}</p>
          )}
      </>
    );
  }
}

export default NeighborhoodCards;
